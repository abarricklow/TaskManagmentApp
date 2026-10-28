import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View,} from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BorderWidths, Colors, FontSizes, FontWeights, IconSizes, Radius, Spacing, } from '../styles/theme';

type Task = {
  id: number;
  name: string;  
  categoryName: string | null;
  dueDate: string | null;
  priority: number;
};

export default function CategoryDetailScreen() {
  const db = useSQLiteContext();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);  
  const [completingTaskIds, setCompletingTaskIds] = useState<number[]>([]);

  const categoryName = name ?? 'Category';

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await db.getAllAsync<Task>(
        `SELECT id, name, due_date AS dueDate, priority
        FROM Tasks
        WHERE category_id = ? AND completed = 0
        ORDER BY priority DESC, due_date IS NULL, due_date, id`,
        Number(id)
      );
      setTasks(rows);
    } catch (loadError) {
      console.error('Unable to load category tasks:', loadError);
      setError('These tasks could not be loaded. Pull down to try again.');
    } finally {
      setIsLoading(false);
    }
  }, [db, id]);

  async function completeTask(taskId: number) {
    setCompletingTaskIds((current) => [...current, taskId]);
    setError(null);
    try {
      await db.runAsync('UPDATE Tasks SET completed = 1 WHERE id = ?', taskId);
      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (completionError) {
      console.error('Unable to complete task:', completionError);
      setError('The task could not be marked complete. Please try again.');
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
          headerRight: () => (
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
          {tasks.length === 1 ? '1 open task' : `${tasks.length} open tasks`}
          {' · Tap ☆ to show a task on Home'}
        </Text>

        {isLoading && tasks.length === 0 ? (
          <ActivityIndicator color={Colors.primary} />
        ) : error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : tasks.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.taskName}>Nothing here yet</Text>
            <Text style={styles.description}>
              Tasks you add to this category will show up here.
            </Text>
          </View>
        ) : (
        <View style={styles.taskList}>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <Pressable
                accessibilityLabel={`Mark ${task.name} as complete`}
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked: false,
                  disabled: completingTaskIds.includes(task.id),
                }}
                disabled={completingTaskIds.includes(task.id)}
                onPress={() => void completeTask(task.id)}
                style={({ pressed }) => [
                  styles.checkbox,
                  pressed && styles.checkboxPressed,
                  completingTaskIds.includes(task.id) && styles.checkboxDisabled,
                ]}
              />
              <View style={styles.taskDetails}>
                <Text style={styles.taskName}>{task.name}</Text>
                {(task.categoryName || task.dueDate) && (
                  <Text style={styles.taskMetadata}>
                    {[task.categoryName, task.dueDate && `Due ${formatDate(task.dueDate)}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                )}
              </View>
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
            </View>
          ))}
        </View>
        )}
      </ScrollView>
    </>
  );
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



  taskList: {
    gap: Spacing.sm,
  },
  taskCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
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