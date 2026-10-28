import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors, FontSizes, Spacing } from './styles/theme';
import BrainDump from '../components/BrainDump';

export default function BrainDumpScreen() {
  const db = useSQLiteContext();
  const [isWorking, setIsWorking] = useState(false);

  async function saveBrainDumpTasks(
    tasks: { name: string; categoryId: number | null; dueDate: string | null }[]
  ) {
    setIsWorking(true);
    try {
      await db.withTransactionAsync(async () => {
        for (const task of tasks) {
          await db.runAsync(
            'INSERT INTO Tasks (name, category_id, due_date) VALUES (?, ?, ?)',
            task.name.trim(),
            task.categoryId,
            task.dueDate
          );
        }
      });
      router.back();
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
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerBackTitle: 'Add' }} />
      <Text style={styles.heading}>Break into subtasks</Text>
      <BrainDump
        onSaveTasks={saveBrainDumpTasks}
        onWorkingChange={setIsWorking}
      />
      {isWorking && <Text style={styles.status}>Working...</Text>}
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
  heading: {
    color: Colors.text,
    fontSize: FontSizes.heading,
    fontWeight: 'bold',
  },
  status: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },
});