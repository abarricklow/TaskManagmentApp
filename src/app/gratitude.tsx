import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { Colors, FontSizes, Spacing } from '../styles/theme';

type GratitudeStage = 'welcome' | 'entry' | 'done';

const ENTRY_COUNT = 3;
const COMPLETION_PAUSE_MS = 2000;

export default function GratitudeScreen() {
  const [stage, setStage] = useState<GratitudeStage>('welcome');
  const [entryIndex, setEntryIndex] = useState(0);
  const [entry, setEntry] = useState('');
  const [entries, setEntries] = useState<string[]>([]);

  useEffect(() => {
    if (stage !== 'done') {
      return;
    }

    const timeout = setTimeout(() => router.replace('/(tabs)'), COMPLETION_PAUSE_MS);
    return () => clearTimeout(timeout);
  }, [stage]);

  function goToNextEntry() {
    const nextEntries = [...entries, entry.trim()];
    setEntries(nextEntries);
    setEntry('');

    if (entryIndex + 1 === ENTRY_COUNT) {
      setStage('done');
      return;
    }
    setEntryIndex((current) => current + 1);
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.title}>Grow Gratitude</Text>

      {stage === 'done' ? (
        <View style={styles.doneContent}>
          <PlantPlaceholder />
          <Text accessibilityRole="header" style={styles.doneTitle}>Done!</Text>
        </View>
      ) : (
        <>
          <PlantPlaceholder />
          {stage === 'welcome' ? (
            <View style={styles.welcomeContent}>
              <View style={styles.welcomePromptContainer}>
                <Text style={styles.welcomePrompt}>
                  Add Three Things You&apos;re Grateful For
                </Text>
              </View>
              <ActionButton label="Start" onPress={() => setStage('entry')} />
            </View>
          ) : (
            <View style={styles.entryContent}>
              <Text style={styles.prompt}>What&apos;s one thing you&apos;re grateful for?</Text>
              <TextInput
                accessibilityLabel={`Gratitude entry ${entryIndex + 1}`}
                multiline
                onChangeText={setEntry}
                placeholder="Write your thought here..."
                placeholderTextColor={Colors.textSecondary}
                style={styles.input}
                textAlignVertical="top"
                value={entry}
              />
              <Text style={styles.progress}>
                {entryIndex + 1} out of {ENTRY_COUNT}
              </Text>
              <ActionButton
                disabled={!entry.trim()}
                label="Next"
                onPress={goToNextEntry}
              />
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function PlantPlaceholder() {
  return (
    <View style={styles.plantPlaceholder}>
      <Text accessibilityLabel="Plant image placeholder" style={styles.plantIllustration}>
        🌱
      </Text>
      <Text style={styles.plantCaption}>Your plant grows with gratitude</Text>
    </View>
  );
}

function ActionButton({
  disabled = false,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        (pressed || disabled) && styles.pressed,
      ]}
    >
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: FontSizes.heading,
    fontWeight: 'bold',
    marginTop: Spacing.md,
  },
  plantPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#E8F3E5',
    borderColor: Colors.border,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 210,
    padding: Spacing.md,
  },
  plantIllustration: {
    fontSize: 72,
  },
  plantCaption: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
    marginTop: Spacing.xs,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    paddingTop: Spacing.md,
  },
  welcomePromptContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  welcomePrompt: {
    color: Colors.text,
    fontSize: FontSizes.heading,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  entryContent: {
    flex: 1,
    gap: Spacing.md,
    paddingTop: Spacing.md,
  },
  prompt: {
    color: Colors.text,
    fontSize: FontSizes.subtitle,
    fontWeight: '600',
  },
  progress: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.text,
    flex: 1,
    fontSize: FontSizes.body,
    minHeight: 140,
    padding: Spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.md,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  doneContent: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.lg,
    justifyContent: 'center',
  },
  doneTitle: {
    color: Colors.primary,
    fontSize: FontSizes.heading,
    fontWeight: 'bold',
  },
});
