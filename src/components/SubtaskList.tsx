import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, FontSizes, Spacing } from '../styles/theme';

export type Subtask = {
  id: number;
  taskId: number;
  name: string;
  completed: number;
};

// Loads the subtasks for the tasks on screen and checks them off.
// Used by the Home page and the category pages.
export function useSubtasks() {
  const db = useSQLiteContext();
  const [subtasksByTask, setSubtasksByTask] = useState<Record<number, Subtask[]>>({});
  const [subtaskError, setSubtaskError] = useState<string | null>(null);

  // Throws on failure so the page's own loading error message is shown
  const loadSubtasks = useCallback(
    async (taskIds: number[]) => {
      if (taskIds.length === 0) {
        setSubtasksByTask({});
        return;
      }
      const rows = await db.getAllAsync<Subtask>(
        `SELECT id, task_id AS taskId, name, completed
        FROM Subtasks
        WHERE task_id IN (${taskIds.map(() => '?').join(', ')})
        ORDER BY position, id`,
        ...taskIds
      );
      const grouped: Record<number, Subtask[]> = {};
      for (const subtask of rows) {
        (grouped[subtask.taskId] ??= []).push(subtask);
      }
      setSubtasksByTask(grouped);
    },
    [db]
  );

  const toggleSubtask = useCallback(
    async (subtask: Subtask) => {
      const setCompleted = (completed: number) =>
        setSubtasksByTask((current) => ({
          ...current,
          [subtask.taskId]: (current[subtask.taskId] ?? []).map((item) =>
            item.id === subtask.id ? { ...item, completed } : item
          ),
        }));

      const nextCompleted = subtask.completed ? 0 : 1;
      // Update the screen right away, then save
      setCompleted(nextCompleted);
      setSubtaskError(null);
      try {
        await db.runAsync(
          'UPDATE Subtasks SET completed = ? WHERE id = ?',
          nextCompleted,
          subtask.id
        );
      } catch (toggleError) {
        console.error('Unable to update subtask:', toggleError);
        setCompleted(subtask.completed);
        setSubtaskError('The subtask could not be updated. Please try again.');
      }
    },
    [db]
  );

  return { subtasksByTask, loadSubtasks, toggleSubtask, subtaskError };
}

// Checkable list shown under a task on its card
export function SubtaskList({
  subtasks,
  onToggle,
}: {
  subtasks: Subtask[];
  onToggle: (subtask: Subtask) => void;
}) {
  if (subtasks.length === 0) return null;

  return (
    <View style={styles.list}>
      {subtasks.map((subtask) => {
        const isDone = Boolean(subtask.completed);
        return (
          <Pressable
            accessibilityLabel={subtask.name}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isDone }}
            key={subtask.id}
            onPress={() => onToggle(subtask)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={[styles.checkbox, isDone && styles.checkboxChecked]}>
              {isDone && (
                <MaterialCommunityIcons color={Colors.onPrimary} name="check" size={14} />
              )}
            </View>
            <Text style={[styles.name, isDone && styles.nameDone]}>{subtask.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Lines up with the task name: parent checkbox (24) + gap
const PARENT_INDENT = 24 + Spacing.sm;

const styles = StyleSheet.create({
  list: {
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginLeft: PARENT_INDENT,
    paddingTop: Spacing.xs,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    minHeight: 36,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: Colors.primary,
    borderRadius: 4,
    borderWidth: 2,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
  },
  name: {
    color: Colors.text,
    flex: 1,
    fontSize: FontSizes.body,
  },
  nameDone: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  pressed: {
    opacity: 0.6,
  },
});