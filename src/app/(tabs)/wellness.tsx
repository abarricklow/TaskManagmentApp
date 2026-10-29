import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors, FontSizes, GlobalStyles, Spacing } from '../../styles/theme';

export default function WellnessScreen() {
  return (
    <View style={styles.content}>
      <View style={styles.options}>
        {['White Noise', 'Journaling', 'Meditation', 'Gratitude'].map((option) => {
          const Option = option === 'Gratitude' ? Pressable : View;
          return (
            <Option
              accessibilityRole={option === 'Gratitude' ? 'button' : undefined}
              key={option}
              onPress={option === 'Gratitude' ? () => router.push('/gratitude') : undefined}
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
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  optionButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.md,
  },
  optionLabel: {
    color: Colors.primary,
    fontSize: FontSizes.subtitle,
    fontWeight: '600',
  },
});