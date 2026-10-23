import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../styles/theme';

export default function AddScreen() {
  return (
    <View style={styles.content}>
      <Text style={styles.heading}>Add to your task list</Text>
      <Text style={styles.description}>
        Create one task or turn a brain dump into smaller steps.
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/new-task')}
        style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
      >
        <Text style={styles.actionTitle}>Quick add a task</Text>
        <Text style={styles.actionDescription}>
          Add a task with a category and due date
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/brain-dump')}
        style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
      >
        <Text style={styles.actionTitle}>Brain dump</Text>
        <Text style={styles.actionDescription}>
          Turn a list of thoughts into subtasks
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: Colors.background,
    gap: Spacing.md,
    padding: Spacing.md,
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
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  actionTitle: {
    color: Colors.primary,
    fontSize: FontSizes.subtitle,
    fontWeight: 'bold',
  },
  actionDescription: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },
});