
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  BorderWidths,
  Colors,
  FontSizes,
  FontWeights,
  IconSizes,
  Opacity,
  Radius,
  Spacing,
} from '../../styles/theme';

const CATEGORIES = [
  {
    id: 'feelings',
    title: 'Feelings',
    description: 'Express how you are feeling today',
    icon: 'heart-outline',
  },
  {
    id: 'day-debrief',
    title: 'Day Debrief',
    description: 'Reflect on what happened today',
    icon: 'weather-sunset',
  },
  {
    id: 'dreams',
    title: 'Dreams',
    description: 'Write and keep track of your dreams',
    icon: 'star-outline',
  },
  {
    id: 'random',
    title: 'Random',
    description: 'Write whatever is on your mind',
    icon: 'notebook-outline',
  },
] as const;

export default function JournalingScreen() {
  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{ title: 'Journaling', headerBackTitle: 'Wellness' }}
      />

      <View style={styles.content}>
        <Text style={styles.heading}>Your journal</Text>
        <Text style={styles.description}>
          What would you like to write about?
        </Text>

        <View style={styles.list}>
          {CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              accessibilityLabel={category.title}
              onPress={() =>
                router.push({
                  pathname: '/journaling/[category]',
                  params: { category: category.id },
                })
              }
              style={({ pressed }) => [
                styles.categoryCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.categoryIcon}>
                <MaterialCommunityIcons
                  name={category.icon}
                  color={Colors.primary}
                  size={IconSizes.medium}
                />
              </View>

              <View style={styles.categoryText}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                color={Colors.textSecondary}
                size={IconSizes.large}
              />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
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
  categoryCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: BorderWidths.thin,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  categoryIcon: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.xl,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  categoryText: {
    flex: 1,
    gap: 2,
  },
  categoryTitle: {
    color: Colors.text,
    fontSize: FontSizes.subtitle,
    fontWeight: FontWeights.semibold,
  },
  categoryDescription: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },
  pressed: {
    opacity: Opacity.pressed,
  },
});
