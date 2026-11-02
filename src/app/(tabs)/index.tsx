
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, FontSizes, IconSizes, Spacing } from '../../styles/theme';
import {
  SubtaskList,
  useSubtasks,
  setTaskCompletedWithGrowth,
} from '../../components/SubtaskList';

// Plant images
import plantpot from '../../../assets/art/plantpot.png';
import babyplant from '../../../assets/art/babyplant.png';
import growingplant from '../../../assets/art/growingplant.png';
import plant1 from '../../../assets/art/plant1.png';
import plant2 from '../../../assets/art/plant2.png';
import plant3 from '../../../assets/art/plant3.png';
import plant4 from '../../../assets/art/plant4.png';
import plant5 from '../../../assets/art/plant5.png';
import plant6 from '../../../assets/art/plant6.png';
import plant7 from '../../../assets/art/plant7.png';
import plant8 from '../../../assets/art/plant8.png';
import plant9 from '../../../assets/art/plant9.png';
import plant10 from '../../../assets/art/plant10.png';
import plant11 from '../../../assets/art/plant11.png';
import plant12 from '../../../assets/art/plant12.png';
import plant13 from '../../../assets/art/plant13.png';
import plant14 from '../../../assets/art/plant14.png';
import plant15 from '../../../assets/art/plant15.png';
import plant16 from '../../../assets/art/plant16.png';
import plant17 from '../../../assets/art/plant17.png';

const plantImages = [
  plant1, plant2, plant3, plant4, plant5,
  plant6, plant7, plant8, plant9, plant10,
  plant11, plant12, plant13, plant14, plant15,
  plant16, plant17,
];

type Task = {
  id: number;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  dueDate: string | null;
};

export default function Index() {
  const db = useSQLiteContext();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingTaskIds, setCompletingTaskIds] = useState<number[]>([]);
  const [totalGrowthPoints, setTotalGrowthPoints] = useState(0);

  const {
    subtasksByTask,
    loadSubtasks,
    toggleSubtask,
    subtaskError,
  } = useSubtasks();

  // Load saved plant growth from SQLite
  const loadPlantProgress = useCallback(async () => {
    try {
      const progress = await db.getFirstAsync<{
        total_points: number;
      }>(
        'SELECT total_points FROM PlantProgress WHERE id = 1'
      );

      setTotalGrowthPoints(progress?.total_points ?? 0);
    } catch (progressError) {
      console.error('Unable to load plant progress:', progressError);
    }
  }, [db]);

  // Load priority tasks
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const savedTasks = await db.getAllAsync<Task>(
        `SELECT Tasks.id, Tasks.name,
          Tasks.category_id AS categoryId,
          Category.name AS categoryName,
          Tasks.due_date AS dueDate
        FROM Tasks
        LEFT JOIN Category ON Category.id = Tasks.category_id
        WHERE Tasks.completed = 0 AND Tasks.priority = 1
        ORDER BY Category.id IS NULL, Category.id,
          Tasks.due_date IS NULL, Tasks.due_date, Tasks.id DESC`
      );

      await loadSubtasks(savedTasks.map((task) => task.id));
      setTasks(savedTasks);

      await loadPlantProgress();
    } catch (loadError) {
      console.error('Unable to load tasks:', loadError);
      setError('Your tasks could not be loaded. Pull down to try again.');
    } finally {
      setIsLoading(false);
    }
  }, [db, loadSubtasks, loadPlantProgress]);

  // Complete a parent task and award plant growth
  async function completeTask(taskId: number) {
    setCompletingTaskIds((current) => [...current, taskId]);
    setError(null);

    try {
      await setTaskCompletedWithGrowth(db, taskId, true);

      await loadPlantProgress();

      setTasks((current) =>
        current.filter((task) => task.id !== taskId)
      );
    } catch (completionError) {
      console.error('Unable to complete task:', completionError);
      setError('The task could not be marked complete. Please try again.');
    } finally {
      setCompletingTaskIds((current) =>
        current.filter((id) => id !== taskId)
      );
    }
  }

  // Remove a task from priority without deleting it
  async function removePriority(taskId: number) {
    setError(null);

    try {
      await db.runAsync(
        'UPDATE Tasks SET priority = 0 WHERE id = ?',
        taskId
      );

      setTasks((current) =>
        current.filter((task) => task.id !== taskId)
      );
    } catch (priorityError) {
      console.error('Unable to update task priority:', priorityError);
      setError('The priority could not be changed. Please try again.');
    }
  }

  // Refresh when returning to Home
  useFocusEffect(
    useCallback(() => {
      void loadTasks();
    }, [loadTasks])
  );

  // Plant growth calculations
  const completedPlantCount = Math.min(
    Math.floor(totalGrowthPoints / 12),
    17
  );

  const currentPlantNumber = Math.min(
    completedPlantCount + 1,
    17
  );

  const currentPlantPoints = totalGrowthPoints % 12;

  const plantImage =
    currentPlantPoints < 4
      ? plantpot
      : currentPlantPoints < 8
        ? babyplant
        : growingplant;

  const growthPercentage = (currentPlantPoints / 12) * 100;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={loadTasks}
        />
      }
    >
      {/* Plant display */}
      <View style={styles.petArea}>
        <Text style={styles.petAreaTitle}>
          Your plant
        </Text>

        <View style={styles.plantDisplay}>
          <Image
            source={plantImage}
            style={styles.plantImage}
            resizeMode="contain"
            accessibilityLabel="Your growing plant"
          />
        </View>

        {/* Growth progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                { width: `${growthPercentage}%` },
              ]}
            />
          </View>

          <Text style={styles.progressText}>
            {currentPlantPoints.toFixed(1)} / 12 growth points
          </Text>
        </View>

        <Text style={styles.petAreaDescription}>
          Plant {currentPlantNumber} · Keep completing tasks to grow!
        </Text>
      </View>

      {/* Priority tasks */}
      <Text style={styles.heading}>
        Priority tasks
      </Text>

      <Text style={styles.description}>
        {tasks.length === 1
          ? '1 priority task'
          : `${tasks.length} priority tasks`}
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
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No priority tasks
          </Text>

          <Text style={styles.description}>
            Open a category and tap the ☆ next to a task to show it here.
          </Text>
        </View>
      ) : (
        <View style={styles.groupList}>
          {groupByCategory(tasks).map((group) => (
            <View
              key={group.categoryId ?? 'none'}
              style={styles.group}
            >
              <Text
                accessibilityRole="header"
                style={styles.groupTitle}
              >
                {group.name}
              </Text>

              <View style={styles.taskList}>
                {group.tasks.map((task) => (
                  <View key={task.id} style={styles.taskCard}>
                    <View style={styles.taskRow}>
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
                          completingTaskIds.includes(task.id) &&
                            styles.checkboxDisabled,
                        ]}
                      />

                      <Pressable
                        accessibilityHint="Opens the task so you can edit it"
                        accessibilityLabel={`Edit ${task.name}`}
                        accessibilityRole="button"
                        onPress={() =>
                          router.push({
                            pathname: '/new-task',
                            params: {
                              taskId: String(task.id),
                              backTitle: 'Home',
                            },
                          })
                        }
                        style={({ pressed }) => [
                          styles.taskDetails,
                          pressed && styles.taskPressed,
                        ]}
                      >
                        <Text style={styles.taskName}>
                          {task.name}
                        </Text>

                        {task.dueDate && (
                          <Text style={styles.taskMetadata}>
                            Due {formatDate(task.dueDate)}
                          </Text>
                        )}
                      </Pressable>

                      <Pressable
                        accessibilityLabel={`Remove ${task.name} from priority tasks`}
                        accessibilityRole="button"
                        hitSlop={Spacing.sm}
                        onPress={() => void removePriority(task.id)}
                        style={({ pressed }) =>
                          pressed && styles.checkboxDisabled
                        }
                      >
                        <MaterialCommunityIcons
                          name="star"
                          size={IconSizes.medium}
                          color={Colors.primary}
                        />
                      </Pressable>
                    </View>

                    <SubtaskList
                      onToggle={async (subtask) => {
                        await toggleSubtask(subtask);
                        await loadPlantProgress();
                      }}
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
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    gap: Spacing.md,
    padding: Spacing.md,
  },

  // Plant area
  petArea: {
    alignItems: 'center',
    backgroundColor: '#E8F3E5',
    borderColor: Colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 250,
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
  },

  petAreaTitle: {
    color: Colors.primary,
    fontSize: FontSizes.subtitle,
    fontWeight: 'bold',
  },

  plantDisplay: {
    alignItems: 'center',
    height: 125,
    justifyContent: 'flex-end',
    position: 'relative',
    width: '100%',
  },

  shelfImage: {
    position: 'absolute',
    bottom: 0,
    width: 230,
    height: 65,
    zIndex: 1,
  },

  plantImage: {
    width: 125,
    height: 105,
    zIndex: 2,
  },

  // Progress bar
  progressContainer: {
    gap: Spacing.xs,
    width: '85%',
  },

  progressBackground: {
    backgroundColor: '#C9DCC4',
    borderRadius: 10,
    height: 12,
    overflow: 'hidden',
    width: '100%',
  },

  progressFill: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: '100%',
  },

  progressText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    textAlign: 'center',
  },

  petAreaDescription: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },

  // Task headings
  heading: {
    color: Colors.text,
    fontSize: FontSizes.heading,
    fontWeight: 'bold',
  },

  description: {
    color: Colors.textSecondary,
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
    fontWeight: 'bold',
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

type TaskGroup = {
  categoryId: number | null;
  name: string;
  tasks: Task[];
};

// Group tasks by category
function groupByCategory(tasks: Task[]) {
  const groups: TaskGroup[] = [];

  for (const task of tasks) {
    const last = groups[groups.length - 1];

    if (last && last.categoryId === task.categoryId) {
      last.tasks.push(task);
    } else {
      groups.push({
        categoryId: task.categoryId,
        name: task.categoryName ?? 'No category',
        tasks: [task],
      });
    }
  }

  return groups;
}

// Format task due dates
function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day).toLocaleDateString();
}
