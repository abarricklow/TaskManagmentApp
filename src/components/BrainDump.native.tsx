import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  models,
  setTelemetryEnabled,
  useLLMChatSession,
} from 'react-native-executorch';
import { Colors, FontSizes, Spacing } from '../app/styles/theme';

const SYSTEM_PROMPT =
  'You turn messy notes into a useful task checklist. Use only the latest notes in the user message. ' +
  'Include every distinct goal, but ignore feelings and unrelated details. ' +
  'Turn broad goals into small, concrete next actions, in the order they should be done. ' +
  'Start each task with a clear action verb. Keep simple goals to one task; split larger goals into a few steps. ' +
  'Do not repeat the notes as-is, invent personal details, or include example tasks. ' +
  'Return only numbered tasks, one per line, with no heading or explanation. ' +
  'Example notes: prepare for an exam and clean the kitchen. ' +
  'Example checklist: 1. List the exam topics and gather study materials. ' +
  '2. Study each topic and mark anything that needs more review. ' +
  '3. Put away items on the kitchen counters. 4. Wipe the counters and clean the sink.';

setTelemetryEnabled(false);

export default function BrainDump({
  onSaveTasks,
  onWorkingChange,
}: {
  onSaveTasks: (tasks: string[]) => Promise<void>;
  onWorkingChange: (isWorking: boolean) => void;
}) {
  const session = useLLMChatSession(models.llm.SMOLLM2_360M.DEFAULT, {
    initialMessages: [{ role: 'system', content: SYSTEM_PROMPT }],
    generationConfig: { maxNewTokens: 384, temperature: 0.2 },
  });
  const [brainDump, setBrainDump] = useState('');
  const [suggestedTasks, setSuggestedTasks] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function breakDownBrainDump() {
    const text = brainDump.trim();
    if (!text) {
      setError('Write down a few things on your mind first.');
      return;
    }
    if (text.length > 4000) {
      setError('Keep your brain dump under 4,000 characters.');
      return;
    }
    if (!session.isReady || !session.sendMessage) {
      setError('The on-device model is still loading.');
      return;
    }

    setIsGenerating(true);
    onWorkingChange(true);
    setError(null);
    setSuggestedTasks([]);
    setSelectedTasks(new Set());
    try {
      const turn = await session.sendMessage(`Use only these notes:\n${text}`);
      const response = [...turn.messages]
        .reverse()
        .find((message) => message.role === 'assistant')?.content;
      if (typeof response !== 'string') {
        throw new Error('The model did not return a task list. Please try again.');
      }

      const tasks = response
        .split(/\r?\n/)
        .map((line) =>
          line
            .trim()
            .replace(/^(?:[-*•]+\s*|\d+[.)]\s*)/, '')
            .replace(/^\*+|\*+$/g, '')
            .trim()
        )
        .filter(
          (line) =>
            /[a-z0-9]/i.test(line) &&
            !/(?:end|start)\s+of\s+text/i.test(line)
        )
        .slice(0, 20);
      if (tasks.length === 0) {
        throw new Error('The model returned an unusable response. Please try again.');
      }

      setSuggestedTasks(tasks);
      setSelectedTasks(new Set(tasks.map((_, index) => index)));
    } catch (generationError) {
      console.error('Unable to process brain dump on device:', generationError);
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Unable to break down the brain dump. Please try again.'
      );
    } finally {
      setIsGenerating(false);
      onWorkingChange(false);
    }
  }

  async function saveSuggestedTasks() {
    const tasksToSave = suggestedTasks.filter((_, index) => selectedTasks.has(index));
    if (tasksToSave.length === 0) {
      setError('Select at least one task to add.');
      return;
    }

    setIsSaving(true);
    onWorkingChange(true);
    setError(null);
    try {
      await onSaveTasks(tasksToSave);
      setBrainDump('');
      setSuggestedTasks([]);
      setSelectedTasks(new Set());
    } catch (saveError) {
      console.error('Unable to save on-device suggestions:', saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'The subtasks could not be saved. Please try again.'
      );
    } finally {
      setIsSaving(false);
      onWorkingChange(false);
    }
  }

  const isWorking = isGenerating || isSaving;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>What&apos;s on your mind?</Text>
      <Text style={styles.description}>
        Your words are processed on this device and aren&apos;t sent to an AI server.
      </Text>
      <TextInput
        accessibilityLabel="Brain dump"
        editable={!isWorking}
        maxLength={4000}
        multiline
        onChangeText={(text) => {
          setBrainDump(text);
          setSuggestedTasks([]);
          setSelectedTasks(new Set());
          setError(null);
        }}
        placeholder="Write freely. Include anything you want to get done..."
        placeholderTextColor={Colors.textSecondary}
        style={[styles.input, styles.multilineInput]}
        textAlignVertical="top"
        value={brainDump}
      />

      {!session.isReady ? (
        <View style={styles.modelStatus}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.description}>
            {session.error
              ? 'The on-device model could not be loaded.'
              : `Preparing on-device AI (${Math.round(session.downloadProgress)}%)`}
          </Text>
        </View>
      ) : (
        <ActionButton
          disabled={isWorking}
          label={isGenerating ? 'Breaking it down...' : 'Break into subtasks'}
          onPress={breakDownBrainDump}
        />
      )}

      {session.error && (
        <Text style={styles.error}>
          {session.error.message} Make sure you have enough free storage and a supported device.
        </Text>
      )}
      {isGenerating && <ActivityIndicator color={Colors.primary} />}
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

      {suggestedTasks.length > 0 && (
        <View style={styles.suggestions}>
          <Text style={styles.sectionTitle}>Review your subtasks</Text>
          {suggestedTasks.map((task, index) => (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selectedTasks.has(index), disabled: isWorking }}
              disabled={isWorking}
              key={`${index}-${task}`}
              onPress={() => {
                setSelectedTasks((current) => {
                  const next = new Set(current);
                  if (next.has(index)) {
                    next.delete(index);
                  } else {
                    next.add(index);
                  }
                  return next;
                });
              }}
              style={({ pressed }) => [styles.taskOption, pressed && styles.pressed]}
            >
              <View
                style={[
                  styles.checkbox,
                  selectedTasks.has(index) && styles.checkboxSelected,
                ]}
              >
                {selectedTasks.has(index) && (
                  <Text style={styles.checkboxMark}>✓</Text>
                )}
              </View>
              <Text style={styles.suggestion}>{task}</Text>
            </Pressable>
          ))}
          <ActionButton
            disabled={isWorking || selectedTasks.size === 0}
            label={isSaving ? 'Adding...' : `Add selected tasks (${selectedTasks.size})`}
            onPress={saveSuggestedTasks}
          />
        </View>
      )}
    </View>
  );
}

function ActionButton({
  disabled,
  label,
  onPress,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.submitButton,
        (pressed || disabled) && styles.pressed,
      ]}
    >
      <Text style={styles.submitLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSizes.subtitle,
    fontWeight: '600',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },
  input: {
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.text,
    fontSize: FontSizes.body,
    padding: Spacing.sm,
  },
  multilineInput: {
    minHeight: 140,
  },
  modelStatus: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  submitLabel: {
    color: '#FFFFFF',
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  suggestions: {
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
    paddingTop: Spacing.md,
  },
  taskOption: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: 4,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxMark: {
    color: '#FFFFFF',
    fontSize: FontSizes.body,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  suggestion: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSizes.body,
  },
  error: {
    color: Colors.error,
    fontSize: FontSizes.body,
  },
});
