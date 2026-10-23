import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors, FontSizes, Spacing } from '../styles/theme';

type Task = {
  id: number;
  name: string;
};

export default function Index() {
  const db = useSQLiteContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const savedTasks = await db.getAllAsync<Task>(
        'SELECT id, name FROM Tasks ORDER BY id DESC'
      );
      setTasks(savedTasks);
    } catch (loadError) {
      console.error('Unable to load tasks:', loadError);
      setError('Your tasks could not be loaded. Pull down to try again.');
    } finally {
      setIsLoading(false);
    }
  }, [db]);

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

      <Text style={styles.heading}>Your to-do list</Text>
      <Text style={styles.description}>
        {tasks.length === 1 ? '1 task' : `${tasks.length} tasks`}
      </Text>

      {isLoading && tasks.length === 0 ? (
        <ActivityIndicator color={Colors.primary} />
      ) : error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : tasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No tasks yet</Text>
          <Text style={styles.description}>
            Add a task or break a brain dump into subtasks to see them here.
          </Text>
        </View>
      ) : (
        <View style={styles.taskList}>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskMarker} />
              <Text style={styles.taskName}>{task.name}</Text>
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
  taskMarker: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  taskName: {
    color: Colors.text,
    flex: 1,
    fontSize: FontSizes.body,
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
