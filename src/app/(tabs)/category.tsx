import { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View,} from 'react-native';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BorderWidths, Colors, FontSizes, FontWeights, GlobalStyles, IconSizes, Opacity, Radius, Spacing,} from '../styles/theme';

type CategorySummary = {
  id: number;
  name: string;
  taskCount: number;
};

type TaskPreview = {
  id: number;
  name: string;
  categoryId: number;
  priority: number;
};

// How many task names to show on each category card
const PREVIEW_LIMIT = 3;

// Number of cards per row
function getColumnCount(screenWidth: number) {
  if (screenWidth >= 1024) return 4; // laptop / desktop
  if (screenWidth >= 768) return 3;  // tablet
  return 2;                          // phone
}

export default function CategoryScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [previews, setPreviews] = useState<Record<number, TaskPreview[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New category modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const columns = getColumnCount(width);
  const availableWidth = width - Spacing.md * 2;
  const cardWidth = (availableWidth - Spacing.md * (columns - 1)) / columns;

  const openModal = useCallback(() => {
    setNewCategoryName('');
    setModalError(null);
    setIsModalVisible(true);
  }, []);

  // Put a "+" button in the top header bar, next to the "Category" title
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityLabel="Create new category"
          accessibilityRole="button"
          hitSlop={Spacing.sm}
          onPress={openModal}
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
        >
          <AntDesign name="plus" size={IconSizes.medium} color={Colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation, openModal]);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await db.getAllAsync<CategorySummary>(
        `SELECT Category.id, Category.name, COUNT(Tasks.id) AS taskCount
        FROM Category
        LEFT JOIN Tasks
          ON Tasks.category_id = Category.id AND Tasks.completed = 0
        GROUP BY Category.id
        ORDER BY Category.id`
      );
      // One query for all open tasks, then group them by category
      const tasks = await db.getAllAsync<TaskPreview>(
        `SELECT id, name, category_id AS categoryId, priority
        FROM Tasks
        WHERE completed = 0 AND category_id IS NOT NULL
        ORDER BY priority DESC, due_date IS NULL, due_date, id`
      );
      const grouped: Record<number, TaskPreview[]> = {};
      for (const task of tasks) {
        (grouped[task.categoryId] ??= []).push(task);
      }
      setCategories(rows);
      setPreviews(grouped);
    } catch (loadError) {
      console.error('Unable to load categories:', loadError);
      setError('Your categories could not be loaded. Pull down to try again.');
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void loadCategories();
    }, [loadCategories])
  );

  async function addCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      setModalError('Enter a category name first.');
      return;
    }

    setIsSaving(true);
    setModalError(null);
    try {
      const result = await db.runAsync(
        'INSERT OR IGNORE INTO Category (name) VALUES (?)',
        name
      );
      if (result.changes === 0) {
        setModalError('A category with that name already exists.');
        return;
      }
      setIsModalVisible(false);
      setNewCategoryName('');
      await loadCategories();
    } catch (saveError) {
      console.error('Unable to save category:', saveError);
      setModalError('The category could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function closeModal() {
    if (isSaving) return;
    setIsModalVisible(false);
    setNewCategoryName('');
    setModalError(null);
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadCategories} />
        }
      >
        <Text style={styles.description}>
          Choose a category to see its tasks.
        </Text>

        {isLoading && categories.length === 0 ? (
          <ActivityIndicator color={Colors.primary} />
        ) : error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : categories.length === 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={openModal}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <Text style={styles.cardTitle}>No categories yet</Text>
            <Text style={styles.cardDescription}>
              Tap here or the + button to add your first category
            </Text>
          </Pressable>
        ) : (
          <View style={styles.grid}>
            {categories.map((category) => (
              <Pressable
                accessibilityLabel={`${category.name}, ${formatCount(category.taskCount)}`}
                accessibilityRole="button"
                key={category.id}
                onPress={() =>
                  router.push({
                    pathname: '/category/[id]',
                    params: { id: String(category.id), name: category.name },
                  })
                }
                style={({ pressed }) => [
                  styles.card,
                  styles.gridCard,
                  { width: cardWidth },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text numberOfLines={2} style={styles.cardTitle}>
                    {category.name}
                  </Text>
                  <Text style={styles.cardDescription}>
                    {formatCount(category.taskCount)}
                  </Text>
                </View>
                <TaskPreviewList tasks={previews[category.id] ?? []} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={closeModal}
        transparent
        visible={isModalVisible}
      >
        <View style={GlobalStyles.modalBackdrop}>
          <View style={GlobalStyles.modalCard}>
            <Text style={styles.heading}>New category</Text>
            <TextInput
              accessibilityLabel="New category name"
              autoFocus
              editable={!isSaving}
              onChangeText={setNewCategoryName}
              onSubmitEditing={addCategory}
              placeholder="Category name"
              placeholderTextColor={Colors.textSecondary}
              returnKeyType="done"
              style={GlobalStyles.input}
              value={newCategoryName}
            />
            {modalError && (
              <Text accessibilityRole="alert" style={styles.error}>
                {modalError}
              </Text>
            )}
            <View style={GlobalStyles.modalActions}>
              <Pressable
                accessibilityRole="button"
                disabled={isSaving}
                onPress={closeModal}
                style={({ pressed }) => [
                  GlobalStyles.cancelButton,
                  (pressed || isSaving) && styles.pressed,
                ]}
              >
                <Text style={GlobalStyles.cancelLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isSaving}
                onPress={addCategory}
                style={({ pressed }) => [
                  GlobalStyles.submitButton,
                  styles.addButton,
                  (pressed || isSaving) && styles.pressed,
                ]}
              >
                <Text style={GlobalStyles.submitLabel}>
                  {isSaving ? 'Adding...' : 'Add'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function TaskPreviewList({ tasks }: { tasks: TaskPreview[] }) {
  if (tasks.length === 0) {
    return <Text style={styles.previewMore}>No open tasks</Text>;
  }
  const shown = tasks.slice(0, PREVIEW_LIMIT);
  const hiddenCount = tasks.length - shown.length;

  return (
    <View style={styles.previewList}>
      {shown.map((task) => (
        <View key={task.id} style={styles.previewRow}>
          {task.priority ? (
            <MaterialCommunityIcons
              accessibilityLabel="Priority"
              name="star"
              size={IconSizes.small}
              color={Colors.primary}
            />
          ) : (
            <Text style={styles.previewBullet}>•</Text>
          )}
          <Text numberOfLines={1} style={styles.previewText}>
            {task.name}
          </Text>
        </View>
      ))}
      {hiddenCount > 0 && (
        <Text style={styles.previewMore}>+{hiddenCount} more</Text>
      )}
    </View>
  );
}

function formatCount(count: number) {
  return count === 1 ? '1 task' : `${count} tasks`;
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  headerButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: BorderWidths.thin,
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  gridCard: {
    gap: Spacing.sm,
    minHeight: 140,
  },
  cardHeader: {
    gap: Spacing.xs,
  },
  previewList: {
    borderTopColor: Colors.border,
    borderTopWidth: BorderWidths.hairline,
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  previewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  previewBullet: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    textAlign: 'center',
    width: IconSizes.small,
  },
  previewText: {
    color: Colors.text,
    flex: 1,
    fontSize: FontSizes.small,
  },
  previewMore: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    fontStyle: 'italic',
  },
  pressed: {
    opacity: Opacity.pressed,
  },
  cardTitle: {
    color: Colors.primary,
    fontSize: FontSizes.subtitle,
    fontWeight: FontWeights.bold,
  },
  cardDescription: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },
  error: {
    color: Colors.error,
    fontSize: FontSizes.body,
  },
  addButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
});