import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View,} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BorderWidths, Colors, FontSizes, FontWeights, Opacity, Radius, Spacing,} from '../styles/theme';

type CategorySummary = {
  id: number;
  name: string;
  taskCount: number;
};

// Number of cards per row
function getColumnCount(screenWidth: number) {
  if (screenWidth >= 1024) return 4; // laptop / desktop
  if (screenWidth >= 768) return 3;  // tablet
  return 2;                          // phone
}

export default function CategoryScreen() {
  const db = useSQLiteContext();
  const { width } = useWindowDimensions();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns = getColumnCount(width);
  const availableWidth = width - Spacing.md * 2;
  const cardWidth = (availableWidth - Spacing.md * (columns - 1)) / columns;

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
      setCategories(rows);
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

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadCategories} />
      }
    >
      <Text style={styles.heading}>Categories</Text>
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
          onPress={() => router.push('/new-task')}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <Text style={styles.cardTitle}>No categories yet</Text>
          <Text style={styles.cardDescription}>
            Create a task to add your first category
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
              <Text numberOfLines={2} style={styles.cardTitle}>
                {category.name}
              </Text>
              <Text style={styles.cardDescription}>
                {formatCount(category.taskCount)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
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
    aspectRatio: 4 / 3,
    justifyContent: 'space-between',
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
});