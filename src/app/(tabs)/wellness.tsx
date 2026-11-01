import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors, FontSizes, GlobalStyles, Spacing } from '../../styles/theme';

// Options that open a page
const ROUTES: Record<string, '/gratitude' | '/meditation' | '/white-noise'> = {
  'White Noise': '/white-noise',
  Gratitude: '/gratitude',
  Meditation: '/meditation',
};

export default function WellnessScreen() {
  return (
    <View style={styles.content}>
      <View style={styles.options}>
        {['White Noise', 'Journaling', 'Meditation', 'Gratitude'].map((option) => {
          const route = ROUTES[option];
          const Option = route ? Pressable : View;
          return (
            <Option
              accessibilityRole={route ? 'button' : undefined}
              key={option}
              onPress={route ? () => router.push(route) : undefined}
              style={styles.optionButton}
            >
              <Text style={styles.optionLabel}>{option}</Text>
            </Option>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    ...GlobalStyles.container,
    justifyContent: 'flex-start',
    padding: Spacing.md,
    paddingTop: Spacing.xl,
  },
  options: {
    alignSelf: 'stretch',
    flex: 1,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  optionButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.md,
  },
  optionLabel: {
    color: Colors.primary,
    fontSize: FontSizes.subtitle,
    fontWeight: '600',
  },
});