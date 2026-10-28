import 'dotenv/config';
import cors from 'cors';
import express, { type Request, type Response } from 'express';
import OpenAI from 'openai';

const app = express();
const port = Number(process.env.API_PORT ?? 3001);
const openAIModel = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
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
  const text = typeof request.body?.text === 'string' ? request.body.text.trim() : '';
  if (!text) {
    response.status(400).json({ error: 'Write down a few things on your mind first.' });
    return;
  }
  if (text.length > 4000) {
    response.status(400).json({ error: 'Keep your brain dump under 4,000 characters.' });
    return;
  }
  if (!process.env.OPENAI_API_KEY) {
    response.status(503).json({
      error: 'The task breakdown service is not configured. Add OPENAI_API_KEY to the backend environment.',
    });
    return;
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: openAIModel,
      temperature: 0.2,
      max_tokens: 600,
      response_format: { type: 'json_object' },
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
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('The AI service did not return a task list.');
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
