import { useCallback, useState } from 'react';
import { Text, View, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors, FontSizes, Spacing } from '../styles/theme';

type Task = {
  id: number;
  name: string;
  due_date: string | null;
  category_name: string | null;
};

export default function Index() {
  const db = useSQLiteContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadTasks() {
        setIsLoading(true);
        setError(null);

        try {
          const results = await db.getAllAsync<Task>(`
            SELECT Tasks.id, Tasks.name, Tasks.due_date,
                   Category.name AS category_name
            FROM Tasks
            LEFT JOIN Category ON Tasks.category_id = Category.id
            ORDER BY Tasks.due_date IS NULL, Tasks.due_date ASC, Tasks.id ASC
          `);

          if (isActive) {
            setTasks(results);
          }
        } catch (loadError) {
          console.error('Unable to load tasks for the home screen:', loadError);
          if (isActive) {
            setError('Tasks could not be loaded. Please try again.');
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      loadTasks();

      return () => {
        isActive = false;
      };
    }, [db])
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.heading}>Current Plant</Text>
        <View style={styles.card}>
          <Text style={styles.emptyTitle}>No current plant selected</Text>
          <Text style={styles.secondaryText}>
            Add a plant to keep track of its growth here.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Tasks</Text>
        <View style={styles.card}>
          {isLoading ? (
            <Text style={styles.secondaryText}>Loading tasks…</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : tasks.length === 0 ? (
            <Text style={styles.secondaryText}>No tasks yet.</Text>
          ) : (
            tasks.map((task) => (
              <View key={task.id} style={styles.task}>
                <Text style={styles.taskName}>{task.name}</Text>
                <Text style={styles.secondaryText}>
                  {[task.category_name, task.due_date && `Due ${task.due_date}`]
                    .filter(Boolean)
                    .join(' · ') || 'No category or due date'}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  heading: {
    color: Colors.text,
    fontSize: FontSizes.heading,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSizes.subtitle,
    fontWeight: '600',
  },
  task: {
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  taskName: {
    color: Colors.text,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  secondaryText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.body,
  },
});
