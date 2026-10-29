import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../styles/theme';

export default function BrainDump(_: {
  onSaveTasks: (
    tasks: { name: string; categoryId: number | null; dueDate: string | null }[]
  ) => Promise<void>;
  onWorkingChange: (isWorking: boolean) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>On-device AI is for mobile</Text>
      <Text style={styles.body}>
        Run this app in an iOS or Android development build to use the local AI model.
        Expo Go and the web version do not include the required native runtime.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  heading: {
    color: Colors.text,
    fontSize: FontSizes.subtitle,
    fontWeight: '600',
  },
  body: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },
});
