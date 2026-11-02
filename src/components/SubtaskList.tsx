
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, FontSizes, Spacing } from '../styles/theme';

export type Subtask = {
  id: number;
  taskId: number;
  name: string;
  completed: number;
};

// Recalculates one task's growth contribution.
// Must be called inside a database transaction.
async function updateTaskGrowth(
  db: SQLiteDatabase,
  taskId: number
) {
  const task = await db.getFirstAsync<{ completed: number }>(
    'SELECT completed FROM Tasks WHERE id = ?',
    taskId
  );

  if (!task) return;

  const subtasks = await db.getFirstAsync<{
    total: number;
    completed: number;
  }>(
    `SELECT COUNT(*) AS total,
      COALESCE(SUM(completed), 0) AS completed
     FROM Subtasks WHERE task_id = ?`,
    taskId
  );

  const total = subtasks?.total ?? 0;
  const completed = subtasks?.completed ?? 0;

  // A completed parent task always contributes exactly 4 points.
  // Otherwise, completed subtasks contribute proportionally.
  const newPoints = task.completed
    ? 4
    : total > 0
      ? (completed / total) * 4
      : 0;

  const previous = await db.getFirstAsync<{ points: number }>(
    'SELECT points FROM TaskGrowth WHERE task_id = ?',
    taskId
  );

  const oldPoints = previous?.points ?? 0;
  const difference = newPoints - oldPoints;

  await db.runAsync(
    `INSERT OR REPLACE INTO TaskGrowth (task_id, points)
     VALUES (?, ?)`,
    taskId,
    newPoints
  );

  if (difference !== 0) {
    await db.runAsync(
      `UPDATE PlantProgress
       SET total_points = MAX(0, total_points + ?)
       WHERE id = 1`,
      difference
    );
  }
}

// Call this whenever a parent task is completed or uncompleted.
// It updates the task and its growth in the same transaction.
export async function setTaskCompletedWithGrowth(
  db: SQLiteDatabase,
  taskId: number,
  completed: boolean
) {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE Tasks SET completed = ? WHERE id = ?',
      completed ? 1 : 0,
      taskId
    );

    await updateTaskGrowth(db, taskId);
  });
}

// Loads the subtasks for the tasks on screen.
export function useSubtasks() {
  const db = useSQLiteContext();
  const [subtasksByTask, setSubtasksByTask] = useState<Record<number, Subtask[]>>({});
  const [subtaskError, setSubtaskError] = useState<string | null>(null);

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
      const nextCompleted = subtask.completed ? 0 : 1;

      const setCompleted = (completed: number) =>
        setSubtasksByTask((current) => ({
          ...current,
          [subtask.taskId]: (current[subtask.taskId] ?? []).map((item) =>
            item.id === subtask.id ? { ...item, completed } : item
          ),
        }));

      setCompleted(nextCompleted);
      setSubtaskError(null);

      try {
        await db.withTransactionAsync(async () => {
          await db.runAsync(
            'UPDATE Subtasks SET completed = ? WHERE id = ?',
            nextCompleted,
            subtask.id
          );

          await updateTaskGrowth(db, subtask.taskId);
        });
      } catch (toggleError) {
        console.error('Unable to update subtask:', toggleError);
        setCompleted(subtask.completed);
        setSubtaskError(
          'The subtask could not be updated. Please try again.'
        );
      }
    },
    [db]
  );

  return {
    subtasksByTask,
    loadSubtasks,
    toggleSubtask,
    subtaskError,
  };
}

// Checkable list shown under a task on its card.
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
                <MaterialCommunityIcons
                  color={Colors.onPrimary}
                  name="check"
                  size={14}
                />
              )}
            </View>

            <Text style={[styles.name, isDone && styles.nameDone]}>
              {subtask.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

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
