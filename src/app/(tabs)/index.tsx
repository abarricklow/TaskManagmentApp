import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, FontSizes, IconSizes, Spacing } from '../styles/theme';

type Task = {
  id: number;
  name: string;
  categoryName: string | null;
  dueDate: string | null;
};

export default function Index() {
  const db = useSQLiteContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingTaskIds, setCompletingTaskIds] = useState<number[]>([]);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const savedTasks = await db.getAllAsync<Task>(
        `SELECT Tasks.id, Tasks.name, Category.name AS categoryName,
          Tasks.due_date AS dueDate
        FROM Tasks
        LEFT JOIN Category ON Category.id = Tasks.category_id
        WHERE Tasks.completed = 0 AND Tasks.priority = 1
        ORDER BY Tasks.due_date IS NULL, Tasks.due_date, Tasks.id DESC`
      );
      setTasks(savedTasks);
    } catch (loadError) {
      console.error('Unable to load tasks:', loadError);
      setError('Your tasks could not be loaded. Pull down to try again.');
    } finally {
      setIsLoading(false);
    }
  }, [db]);

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

  // Un-starring a task removes it from the home page (it stays in its category)
  async function removePriority(taskId: number) {
    setError(null);
    try {
      await db.runAsync('UPDATE Tasks SET priority = 0 WHERE id = ?', taskId);
      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (priorityError) {
      console.error('Unable to update task priority:', priorityError);
      setError('The priority could not be changed. Please try again.');
    }
  }

  useFocusEffect(
    useCallback(() => {
      void loadTasks();
    }, [loadTasks])
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadTasks} />
      }
    >
      <View style={styles.petArea}>
        <Text style={styles.petAreaTitle}>Your plant pet</Text>
        <Text accessibilityLabel="A small growing plant" style={styles.plantIllustration}>
          🌱
        </Text>
        <Text style={styles.petAreaDescription}>
          Your plant will grow here
        </Text>
      </View>

      <Text style={styles.heading}>Priority tasks</Text>
      <Text style={styles.description}>
        {tasks.length === 1 ? '1 priority task' : `${tasks.length} priority tasks`}
      </Text>

      {isLoading && tasks.length === 0 ? (
        <ActivityIndicator color={Colors.primary} />
      ) : error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : tasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No priority tasks</Text>
          <Text style={styles.description}>
            Open a category and tap the ☆ next to a task to show it here.
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
                accessibilityLabel={`Remove ${task.name} from priority tasks`}
                accessibilityRole="button"
                hitSlop={Spacing.sm}
                onPress={() => void removePriority(task.id)}
                style={({ pressed }) => pressed && styles.checkboxDisabled}
              >
                <MaterialCommunityIcons
                  name="star"
                  size={IconSizes.medium}
                  color={Colors.primary}
                />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  petArea: {
    alignItems: 'center',
    backgroundColor: '#E8F3E5',
    borderColor: Colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 210,
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  petAreaTitle: {
    color: Colors.primary,
    fontSize: FontSizes.subtitle,
    fontWeight: 'bold',
  },
  plantIllustration: {
    fontSize: 64,
  },
  petAreaDescription: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
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
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSizes.subtitle,
    fontWeight: '600',
  },
  error: {
    color: Colors.error,
    fontSize: FontSizes.body,
  },
});

function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}