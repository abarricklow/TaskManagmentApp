import 'dotenv/config';
import cors from 'cors';
import express, { type Request, type Response } from 'express';

const app = express();
const port = Number(process.env.API_PORT ?? 3001);
const ollamaHost = process.env.OLLAMA_HOST?.replace(/\/$/, '') ?? 'http://127.0.0.1:11434';
const ollamaModel = process.env.OLLAMA_MODEL ?? 'llama3.2:1b';
const ollamaTimeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS ?? 120_000);
const allowedOrigins = process.env.ALLOWED_WEB_ORIGIN
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins?.length
      ? (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin))
      : true,
  })
);
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (_request: Request, response: Response) => {
  response.json({ status: 'ok' });
});

app.post('/api/tasks/breakdown', async (request: Request, response: Response) => {
  console.log("/api/tasks/breakdown")
  const text = typeof request.body?.text === 'string' ? request.body.text.trim() : '';
  if (!text) {
    response.status(400).json({ error: 'Write down a few things on your mind first.' });
    return;
  }
  if (text.length > 4000) {
    response.status(400).json({ error: 'Keep your brain dump under 4,000 characters.' });
    return;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ollamaTimeoutMs);
    let ollamaResponse: globalThis.Response;

    try {
      ollamaResponse = await fetch(`${ollamaHost}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: ollamaModel,
          stream: false,
          format: 'json',
          options: { temperature: 0.2, num_predict: 600 },
          messages: [
            {
              role: 'system',
              content:
                'Turn messy notes into a useful task checklist. Use only the supplied notes. ' +
                'Include every distinct goal, ignore feelings and unrelated details, and turn broad goals ' +
                'into clear concrete next actions. Use a clear action verb for each task. Keep simple goals ' +
                'as one task and split larger goals into a few steps. Do not repeat the notes as-is or invent details. ' +
                'Return valid JSON with exactly this shape: {"tasks":["First task","Second task"]}. ' +
                'Return no markdown or other text.',
            },
            { role: 'user', content: text },
          ],
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!ollamaResponse.ok) {
      const detail = await ollamaResponse.text();
      throw new Error(`Ollama returned ${ollamaResponse.status}: ${detail}`);
    }

    const completion = await ollamaResponse.json() as { message?: { content?: unknown } };
    const content = completion.message?.content;
    if (typeof content !== 'string' || content.length === 0) {
      throw new Error('Ollama did not return a task list.');
    }

    const parsed = JSON.parse(content) as { tasks?: unknown };
    const tasks = Array.isArray(parsed.tasks)
      ? parsed.tasks
          .filter((task): task is string => typeof task === 'string')
          .map((task) => task.trim().replace(/^[-*•]+\s*/, '').replace(/^\d+[.)]\s*/, '').trim())
          .filter((task) => task.length > 0)
          .slice(0, 20)
      : [];

    if (tasks.length === 0) {
      throw new Error('The AI service returned an unusable task list.');
    }

    response.json({ tasks });
  } catch (error) {
    console.error('Task breakdown failed:', error);
    response.status(502).json({
      error: 'The AI task breakdown service is unavailable. Please try again.',
    });
  }
});

app.listen(port, () => {
  console.log(`Task breakdown API listening on http://localhost:${port}`);
});
