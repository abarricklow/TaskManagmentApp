
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  BorderWidths,
  Colors,
  FontSizes,
  FontWeights,
  Radius,
  Spacing,
} from '../../styles/theme';

const JOURNAL_PROMPTS: Record<string, { title: string; prompt: string }> = {
  feelings: {
    title: 'Feelings',
    prompt: 'How are you feeling today? What has been on your mind lately?',
  },
  'day-debrief': {
    title: 'Day Debrief',
    prompt: 'What happened today? What went well? What would you like to change?',
  },
  dreams: {
    title: 'Dreams',
    prompt: 'What are you dreaming about?',
  },
  random: {
    title: 'Random',
    prompt: 'Write about anything and everything.',
  },
};

export default function JournalEntryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const [entry, setEntry] = useState('');

  const journal = JOURNAL_PROMPTS[category] ?? JOURNAL_PROMPTS.random;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: journal.title,
          headerBackTitle: 'Journaling',
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>{journal.title}</Text>

        

        <View style={styles.promptCard}>
          <Text style={styles.promptLabel}>A little inspiration</Text>
          <Text style={styles.promptText}>{journal.prompt}</Text>
        </View>

        <Text style={styles.inputLabel}>Your thoughts</Text>

        <TextInput
          accessibilityLabel={`${journal.title} journal entry`}
          multiline
          placeholder="Start writing here..."
          placeholderTextColor={Colors.textSecondary}
          value={entry}
          onChangeText={setEntry}
          style={styles.textInput}
          textAlignVertical="top"
        />

        <Text style={styles.characterCount}>
          {entry.length} characters
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  content: {
    flexGrow: 1,
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
  promptCard: {
    backgroundColor: Colors.surfaceTint,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  promptLabel: {
    color: Colors.primary,
    fontSize: FontSizes.small,
    fontWeight: FontWeights.semibold,
  },
  promptText: {
    color: Colors.text,
    fontSize: FontSizes.body,
    lineHeight: 24,
  },
  inputLabel: {
    color: Colors.text,
    fontSize: FontSizes.subtitle,
    fontWeight: FontWeights.semibold,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: BorderWidths.thin,
    color: Colors.text,
    flex: 1,
    fontSize: FontSizes.body,
    lineHeight: 24,
    minHeight: 280,
    padding: Spacing.md,
  },
  characterCount: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    textAlign: 'right',
  },
});
