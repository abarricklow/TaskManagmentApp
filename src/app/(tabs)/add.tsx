import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors, FontSizes, Spacing } from '../styles/theme';
import BrainDump from '../../components/BrainDump';

type Mode = 'quick' | 'brain-dump' | null;

export default function AddScreen() {
  const db = useSQLiteContext();
  const [mode, setMode] = useState<Mode>(null);
  const [taskName, setTaskName] = useState('');
  const [hasOpenedBrainDump, setHasOpenedBrainDump] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function selectMode(nextMode: Exclude<Mode, null>) {
    setMode(nextMode);
    if (nextMode === 'brain-dump') {
      setHasOpenedBrainDump(true);
    }
    setError(null);
    setMessage(null);
  }

  async function addQuickTask() {
    const name = taskName.trim();
    if (!name) {
      setError('Enter a task name first.');
      return;
    }

    setIsWorking(true);
    setError(null);
    setMessage(null);
    try {
      await db.runAsync('INSERT INTO Tasks (name) VALUES (?)', name);
      setTaskName('');
      setMessage('Task added.');
    } catch (saveError) {
      console.error('Unable to save task:', saveError);
      setError('The task could not be saved. Please try again.');
    } finally {
      setIsWorking(false);
    }
  }

  async function saveBrainDumpTasks(taskNames: string[]) {
    setIsWorking(true);
    setError(null);
    setMessage(null);
    try {
      await db.withTransactionAsync(async () => {
        for (const task of taskNames) {
          await db.runAsync('INSERT INTO Tasks (name) VALUES (?)', task.trim());
        }
      });
      setMessage('Subtasks added to your task list.');
    } catch (saveError) {
      console.error('Unable to save suggested tasks:', saveError);
      throw new Error('The subtasks could not be saved. Please try again.', {
        cause: saveError,
      });
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Add to your task list</Text>
      <Text style={styles.description}>
        Add one task quickly, or get help breaking a brain dump into smaller steps.
      </Text>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => selectMode('quick')}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <Text style={styles.actionTitle}>Quick add a task</Text>
          <Text style={styles.actionDescription}>Add one task by name</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => selectMode('brain-dump')}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <Text style={styles.actionTitle}>Brain dump</Text>
          <Text style={styles.actionDescription}>Turn a list of thoughts into subtasks</Text>
        </Pressable>
      </View>

      {mode === 'quick' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>New task</Text>
          <TextInput
            accessibilityLabel="Task name"
            onChangeText={setTaskName}
            onSubmitEditing={addQuickTask}
            placeholder="What do you need to do?"
            placeholderTextColor={Colors.textSecondary}
            returnKeyType="done"
            style={styles.input}
            value={taskName}
          />
          <ActionButton
            disabled={isWorking}
            label={isWorking ? 'Adding...' : 'Add task'}
            onPress={addQuickTask}
          />
        </View>
      )}

      {hasOpenedBrainDump && (
        <View style={mode === 'brain-dump' ? undefined : styles.hidden}>
          <BrainDump
            onSaveTasks={saveBrainDumpTasks}
            onWorkingChange={setIsWorking}
          />
        </View>
      )}

      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {message && <Text style={styles.success}>{message}</Text>}
    </ScrollView>
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
  content: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  hidden: {
    display: 'none',
  },
  heading: {
    color: Colors.text,
    fontSize: FontSizes.heading,
    fontWeight: 'bold',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },
  actions: {
    gap: Spacing.sm,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  actionTitle: {
    color: Colors.primary,
    fontSize: FontSizes.subtitle,
    fontWeight: 'bold',
  },
  actionDescription: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },
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
  input: {
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.text,
    fontSize: FontSizes.body,
    padding: Spacing.sm,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.md,
  },
  submitLabel: {
    color: '#FFFFFF',
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  error: {
    color: Colors.error,
    fontSize: FontSizes.body,
  },
  success: {
    color: Colors.primary,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
});
