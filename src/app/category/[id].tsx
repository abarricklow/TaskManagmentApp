import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View,} from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BorderWidths, Colors, FontSizes, FontWeights, IconSizes, Radius, Spacing, } from '../../styles/theme';
import { SubtaskList, useSubtasks } from '../../components/SubtaskList';

type Task = {
  id: number;
  name: string;
  categoryId?: number | null;
  categoryName?: string | null;
  dueDate: string | null;
  priority: number;
};

// The "Finished" card on the Category tab opens this screen with this id.
// It isn't a real category: it lists every completed task.
const FINISHED_ID = 'finished';

export default function CategoryDetailScreen() {
  const db = useSQLiteContext();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);  
  const [completingTaskIds, setCompletingTaskIds] = useState<number[]>([]);
  const { subtasksByTask, loadSubtasks, toggleSubtask, subtaskError } = useSubtasks();

  const isFinished = id === FINISHED_ID;
  const categoryName = name ?? (isFinished ? 'Finished' : 'Category');

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = isFinished
        ? // Every completed task, sorted by its original category
          // (same order as the Category tab), newest first within each
          await db.getAllAsync<Task>(
            `SELECT Tasks.id, Tasks.name, Tasks.category_id AS categoryId,
              Category.name AS categoryName, Tasks.due_date AS dueDate,
              Tasks.priority
            FROM Tasks
            LEFT JOIN Category ON Category.id = Tasks.category_id
            WHERE Tasks.completed = 1
            ORDER BY Category.id IS NULL, Category.id, Tasks.id DESC`
          )
        : await db.getAllAsync<Task>(
            `SELECT id, name, due_date AS dueDate, priority
            FROM Tasks
            WHERE category_id = ? AND completed = 0
            ORDER BY priority DESC, due_date IS NULL, due_date, id`,
            Number(id)
          );
      await loadSubtasks(rows.map((task) => task.id));
      setTasks(rows);
    } catch (loadError) {
      console.error('Unable to load category tasks:', loadError);
      setError('These tasks could not be loaded. Pull down to try again.');
    } finally {
      setIsLoading(false);
    }
  }, [db, id, isFinished, loadSubtasks]);

  // In a normal category this marks the task complete (it moves to Finished).
  // In Finished it restores the task to its original category.
  async function completeTask(taskId: number) {
    setCompletingTaskIds((current) => [...current, taskId]);
    setError(null);
    try {
      await db.runAsync(
        'UPDATE Tasks SET completed = ? WHERE id = ?',
        isFinished ? 0 : 1,
        taskId
      );
      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (completionError) {
      console.error('Unable to complete task:', completionError);
      setError(
        isFinished
          ? 'The task could not be restored. Please try again.'
          : 'The task could not be marked complete. Please try again.'
      );
    } finally {
      setCompletingTaskIds((current) => current.filter((id) => id !== taskId));
    }
  }

  async function togglePriority(task: Task) {
    const nextPriority = task.priority ? 0 : 1;
    // Update the screen right away, then save
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, priority: nextPriority } : item
      )
    );
    setError(null);
    try {
      await db.runAsync(
        'UPDATE Tasks SET priority = ? WHERE id = ?',
        nextPriority,
        task.id
      );
    } catch (priorityError) {
      console.error('Unable to update task priority:', priorityError);
      setError('The priority could not be changed. Please try again.');
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, priority: task.priority } : item
        )
      );
    }
  }

  useFocusEffect(
    useCallback(() => {
      void loadTasks();
    }, [loadTasks])
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: categoryName,
          headerBackTitle: 'Categories',
          headerStyle: { backgroundColor: Colors.background },
          // Tasks can't be added straight to Finished
          headerRight: isFinished ? undefined : () => (
            <Pressable
              accessibilityLabel={`Add a task to ${categoryName}`}
              accessibilityRole="button"
              hitSlop={Spacing.sm}
              onPress={() =>
                router.push({ pathname: '/new-task', params: { categoryId: id, categoryName } })
              }
              style={({ pressed }) => [styles.headerButton, pressed && styles.headerButtonPressed]}
            >
              <MaterialCommunityIcons
                color={Colors.primary}
                name="plus"
                size={IconSizes.medium}
              />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadTasks} />
        }
      >
        <Text style={styles.heading}>{categoryName}</Text>
        <Text style={styles.description}>
          {isFinished
            ? `${tasks.length === 1 ? '1 finished task' : `${tasks.length} finished tasks`} · Tap ✓ to restore a task`
            : `${tasks.length === 1 ? '1 open task' : `${tasks.length} open tasks`} · Tap ☆ to show a task on Home`}
        </Text>

        {subtaskError && (
          <Text accessibilityRole="alert" style={styles.error}>
            {subtaskError}
          </Text>
        )}
        {isLoading && tasks.length === 0 ? (
          <ActivityIndicator color={Colors.primary} />
        ) : error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : tasks.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.taskName}>
              {isFinished ? 'No finished tasks yet' : 'Nothing here yet'}
            </Text>
            <Text style={styles.description}>
              {isFinished
                ? 'Tasks you check off will show up here.'
                : 'Tasks you add to this category will show up here.'}
            </Text>
          </View>
        ) : (
        <View style={styles.groupList}>
          {/* Finished is split into one section per original category;
              a normal category is a single section with no heading */}
          {(isFinished
            ? groupByCategory(tasks)
            : [{ categoryId: null, name: null, tasks }]
          ).map((group) => (
          <View key={group.categoryId ?? 'none'} style={styles.group}>
          {group.name !== null && (
            <Text accessibilityRole="header" style={styles.groupTitle}>
              {group.name}
            </Text>
          )}
        <View style={styles.taskList}>
          {group.tasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskRow}>
              <Pressable
                accessibilityLabel={
                  isFinished
                    ? `Restore ${task.name} to open tasks`
                    : `Mark ${task.name} as complete`
                }
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked: isFinished,
                  disabled: completingTaskIds.includes(task.id),
                }}
                disabled={completingTaskIds.includes(task.id)}
                onPress={() => void completeTask(task.id)}
                style={({ pressed }) => [
                  styles.checkbox,
                  isFinished && styles.checkboxChecked,
                  pressed && styles.checkboxPressed,
                  completingTaskIds.includes(task.id) && styles.checkboxDisabled,
                ]}
              >
                {isFinished && (
                  <MaterialCommunityIcons
                    color={Colors.onPrimary}
                    name="check"
                    size={IconSizes.small + 6}
                  />
                )}
              </Pressable>
              <Pressable
                accessibilityHint="Opens the task so you can edit it"
                accessibilityLabel={`Edit ${task.name}`}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/new-task',
                    params: { taskId: String(task.id), backTitle: categoryName },
                  })
                }
                style={({ pressed }) => [styles.taskDetails, pressed && styles.taskPressed]}
              >
                <Text style={[styles.taskName, isFinished && styles.taskNameFinished]}>
                  {task.name}
                </Text>
                {task.dueDate && (
                  <Text style={styles.taskMetadata}>Due {formatDate(task.dueDate)}</Text>
                )}
              </Pressable>
              {!isFinished && (
              <Pressable
                accessibilityLabel={
                  task.priority
                    ? `Remove ${task.name} from priority tasks`
                    : `Mark ${task.name} as a priority task`
                }
                accessibilityRole="togglebutton"
                accessibilityState={{ checked: Boolean(task.priority) }}
                hitSlop={Spacing.sm}
                onPress={() => void togglePriority(task)}
                style={({ pressed }) => pressed && styles.checkboxPressed}
              >
                <MaterialCommunityIcons
                  name={task.priority ? 'star' : 'star-outline'}
                  size={IconSizes.medium}
                  color={task.priority ? Colors.primary : Colors.textSecondary}
                />
              </Pressable>
              )}
              </View>
              <SubtaskList
                onToggle={(subtask) => void toggleSubtask(subtask)}
                subtasks={subtasksByTask[task.id] ?? []}
              />
            </View>
          ))}
        </View>
          </View>
          ))}
        </View>
        )}
      </ScrollView>
    </>
  );
}

type TaskGroup = {
  categoryId: number | null;
  name: string | null;
  tasks: Task[];
};

// Tasks arrive sorted by category, so each new category starts a new group
function groupByCategory(tasks: Task[]) {
  const groups: TaskGroup[] = [];
  for (const task of tasks) {
    const categoryId = task.categoryId ?? null;
    const last = groups[groups.length - 1];
    if (last && last.categoryId === categoryId) {
      last.tasks.push(task);
    } else {
      groups.push({
        categoryId,
        name: task.categoryName ?? 'No category',
        tasks: [task],
      });
    }
  }
  return groups;
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}

const styles = StyleSheet.create({
  headerButton: {
    padding: Spacing.xs,
  },
  headerButtonPressed: {
    opacity: 0.7,
  },
  content: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  heading: {
    color: Colors.text,
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },
  list: {
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: BorderWidths.thin,
    gap: Spacing.xs,
    padding: Spacing.md,
  },
 // taskName: {
  //  color: Colors.text,
  //  fontSize: FontSizes.body,
  //},
  metadata: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
  },
  error: {
    color: Colors.error,
    fontSize: FontSizes.body,
  },



  groupList: {
    gap: Spacing.lg,
  },
  group: {
    gap: Spacing.sm,
  },
  groupTitle: {
    color: Colors.primary,
    fontSize: FontSizes.subtitle,
    fontWeight: FontWeights.bold,
  },
  taskList: {
    gap: Spacing.sm,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  taskRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: Colors.primary,
    borderRadius: 5,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
  },
  taskNameFinished: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  taskPressed: {
    opacity: 0.6,
  },
  checkboxPressed: {
    backgroundColor: '#E8F3E5',
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  taskName: {
    color: Colors.text,
    fontSize: FontSizes.body,
  },
  taskDetails: {
    flex: 1,
    gap: Spacing.xs,
  },
  taskMetadata: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.sm,
    padding: Spacing.md,
  },
});