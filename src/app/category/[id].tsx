import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View,} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BorderWidths, Colors, FontSizes, FontWeights, Radius, Spacing,} from '../styles/theme';

type Task = {
  id: number;
  name: string;
  dueDate: string | null;
};

export default function CategoryDetailScreen() {
  const db = useSQLiteContext();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoryName = name ?? 'Category';

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await db.getAllAsync<Task>(
        `SELECT id, name, due_date AS dueDate
        FROM Tasks
        WHERE category_id = ? AND completed = 0
        ORDER BY due_date IS NULL, due_date, id`,
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
          headerStyle: { backgroundColor: Colors.background },
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
          <View style={styles.list}>
            {tasks.map((task) => (
              <View key={task.id} style={styles.card}>
                <Text style={styles.taskName}>{task.name}</Text>
                {task.dueDate && (
                  <Text style={styles.metadata}>Due {formatDate(task.dueDate)}</Text>
                )}
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
  taskName: {
    color: Colors.text,
    fontSize: FontSizes.body,
  },
  metadata: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
  },
  error: {
    color: Colors.error,
    fontSize: FontSizes.body,
  },
});