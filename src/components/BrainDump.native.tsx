import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors, FontSizes, Spacing } from '../app/styles/theme';

type SuggestedTask = {
  name: string;
  categoryId: number | null;
  dueDate: string | null;
};

type Category = {
  id: number;
  name: string;
};

const expoHostUri =
  Constants.expoConfig?.hostUri ??
  Constants.experienceUrl?.replace(/^exp:\/\//, '') ??
  Constants.linkingUri?.replace(/^exp:\/\//, '');
const devHost = expoHostUri?.split('/')[0]?.split(':')[0];
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const isLoopbackApiUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(
  configuredApiUrl ?? ''
);
const apiUrl =
  (configuredApiUrl && !isLoopbackApiUrl
    ? configuredApiUrl
    : devHost
      ? `http://${devHost}:3001`
      : 'http://localhost:3001');

export default function BrainDump({
  onSaveTasks,
  onWorkingChange,
}: {
  onSaveTasks: (
    tasks: { name: string; categoryId: number | null; dueDate: string | null }[]
  ) => Promise<void>;
  onWorkingChange: (isWorking: boolean) => void;
}) {
  const db = useSQLiteContext();
  const [brainDump, setBrainDump] = useState('');
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [editedTask, setEditedTask] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [draftDueDate, setDraftDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const savedCategories = await db.getAllAsync<Category>(
          'SELECT id, name FROM Category ORDER BY id'
        );
        if (isMounted) {
          setCategories(savedCategories);
        }
      } catch (loadError) {
        console.error('Unable to load task categories:', loadError);
        if (isMounted) {
          setError('Task categories could not be loaded. Please try again.');
        }
      }
    }

    void loadCategories();
    return () => {
      isMounted = false;
    };
  }, [db]);

  async function breakDownBrainDump() {
    const text = brainDump.trim();
    if (!text) {
      setError('Write down a few things on your mind first.');
      return;
    }
    if (text.length > 4000) {
      setError('Keep your brain dump under 4,000 characters.');
      return;
    }
    setIsGenerating(true);
    onWorkingChange(true);
    setError(null);
    setSuggestedTasks([]);
    setSelectedTasks(new Set());
    try {
      const response = await fetch(`${apiUrl}/api/tasks/breakdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const body = (await response.json()) as { tasks?: unknown; error?: unknown };
      if (!response.ok) {
        throw new Error(
          typeof body.error === 'string'
            ? body.error
            : 'Unable to reach the task breakdown service.'
        );
      }
      const tasks = Array.isArray(body.tasks)
        ? body.tasks.filter((task): task is string => typeof task === 'string')
        : [];
      if (tasks.length === 0) {
        throw new Error('The task breakdown service returned an unusable response.');
      }

      setSuggestedTasks(tasks.map((name) => ({ name, categoryId: null, dueDate: null })));
      setSelectedTasks(new Set(tasks.map((_, index) => index)));
    } catch (generationError) {
      console.error('Unable to process brain dump:', generationError);
      setError(
        generationError instanceof Error
          ? `${generationError.message} (${apiUrl})`
          : `Unable to break down the brain dump. Please try again. (${apiUrl})`
      );
    } finally {
      setIsGenerating(false);
      onWorkingChange(false);
    }
  }

  async function saveSuggestedTasks() {
    const tasksToSave = suggestedTasks.filter((_, index) => selectedTasks.has(index));
    if (tasksToSave.length === 0) {
      setError('Select at least one task to add.');
      return;
    }

    setIsSaving(true);
    onWorkingChange(true);
    setError(null);
    try {
      await onSaveTasks(tasksToSave);
      setBrainDump('');
      setSuggestedTasks([]);
      setSelectedTasks(new Set());
    } catch (saveError) {
      console.error('Unable to save suggested tasks:', saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'The subtasks could not be saved. Please try again.'
      );
    } finally {
      setIsSaving(false);
      onWorkingChange(false);
    }
  }

  function openTaskEditor(index: number) {
    const task = suggestedTasks[index];
    setEditingTaskIndex(index);
    setEditedTask(task.name);
    setSelectedCategoryId(task.categoryId ?? categories[0]?.id ?? null);
    setDueDate(task.dueDate ? parseDateFromDatabase(task.dueDate) : null);
    setDraftDueDate(task.dueDate ? parseDateFromDatabase(task.dueDate) : new Date());
    setIsCategoryDropdownOpen(false);
    setCategoryError(null);
    setEditError(null);
  }

  function saveEditedTask() {
    const updatedTask = editedTask.trim();
    if (!updatedTask) {
      setEditError('Enter a task name first.');
      return;
    }
    if (!dueDate) {
      setEditError('Choose a due date first.');
      return;
    }
    if (selectedCategoryId === null) {
      setEditError('Choose a task category first.');
      return;
    }
    if (editingTaskIndex === null) {
      return;
    }

    setSuggestedTasks((current) =>
      current.map((task, index) =>
        index === editingTaskIndex
          ? {
              name: updatedTask,
              categoryId: selectedCategoryId,
              dueDate: formatDateForDatabase(dueDate),
            }
          : task
      )
    );
    setEditingTaskIndex(null);
    setIsCategoryDropdownOpen(false);
    setEditError(null);
  }

  function closeTaskEditor() {
    setEditingTaskIndex(null);
    setIsCategoryDropdownOpen(false);
    setShowDatePicker(false);
    setEditError(null);
  }

  async function addCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryError('Enter a category name first.');
      return;
    }

    setIsSavingCategory(true);
    setCategoryError(null);
    try {
      await db.runAsync('INSERT OR IGNORE INTO Category (name) VALUES (?)', name);
      const category = await db.getFirstAsync<Category>(
        'SELECT id, name FROM Category WHERE name = ?',
        name
      );
      if (!category) {
        throw new Error('The category could not be found after saving.');
      }

      setCategories((current) =>
        current.some((item) => item.id === category.id)
          ? current
          : [...current, category]
      );
      setSelectedCategoryId(category.id);
      setIsCategoryDropdownOpen(false);
      setNewCategoryName('');
      setIsCategoryModalVisible(false);
    } catch (saveError) {
      console.error('Unable to save task category:', saveError);
      setCategoryError('The category could not be saved. Please try again.');
    } finally {
      setIsSavingCategory(false);
    }
  }

  function closeCategoryModal() {
    if (isSavingCategory) {
      return;
    }
    setIsCategoryModalVisible(false);
    setNewCategoryName('');
    setCategoryError(null);
  }

  const isWorking = isGenerating || isSaving;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>What&apos;s on your mind?</Text>
      <Text style={styles.description}>
        Your words are sent only to this app&apos;s secure task breakdown API.
      </Text>
      <TextInput
        accessibilityLabel="Brain dump"
        editable={!isWorking}
        maxLength={4000}
        multiline
        onChangeText={(text) => {
          setBrainDump(text);
          setSuggestedTasks([]);
          setSelectedTasks(new Set());
          setError(null);
        }}
        placeholder="Write freely. Include anything you want to get done..."
        placeholderTextColor={Colors.textSecondary}
        style={[styles.input, styles.multilineInput]}
        textAlignVertical="top"
        value={brainDump}
      />

      <ActionButton
        disabled={isWorking}
        label={isGenerating ? 'Breaking it down...' : 'Break into subtasks'}
        onPress={breakDownBrainDump}
      />

      {isGenerating && <ActivityIndicator color={Colors.primary} />}
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

      {suggestedTasks.length > 0 && (
        <View style={styles.suggestions}>
          <Text style={styles.sectionTitle}>Review your subtasks</Text>
          {suggestedTasks.map((task, index) => (
            <View key={`${index}-${task.name}`} style={styles.taskOption}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selectedTasks.has(index), disabled: isWorking }}
                disabled={isWorking}
                onPress={() => {
                  setSelectedTasks((current) => {
                    const next = new Set(current);
                    if (next.has(index)) {
                      next.delete(index);
                    } else {
                      next.add(index);
                    }
                    return next;
                  });
                }}
                style={({ pressed }) => [styles.taskSelect, pressed && styles.pressed]}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedTasks.has(index) && styles.checkboxSelected,
                  ]}
                >
                  {selectedTasks.has(index) && (
                    <Text style={styles.checkboxMark}>✓</Text>
                  )}
                </View>
                <Text style={styles.suggestion}>{task.name}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={`Edit ${task.name}`}
                accessibilityRole="button"
                disabled={isWorking}
                onPress={() => openTaskEditor(index)}
                style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
              >
                <Text style={styles.editLabel}>✎ Edit</Text>
              </Pressable>
            </View>
          ))}
          <ActionButton
            disabled={isWorking || selectedTasks.size === 0}
            label={isSaving ? 'Adding...' : `Add selected tasks (${selectedTasks.size})`}
            onPress={saveSuggestedTasks}
          />
        </View>
      )}
      <Modal
        animationType="fade"
        onRequestClose={closeTaskEditor}
        transparent
        visible={editingTaskIndex !== null}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>Edit suggested task</Text>
            <Text style={styles.fieldLabel}>Category</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: isCategoryDropdownOpen }}
              onPress={() => setIsCategoryDropdownOpen((open) => !open)}
              style={({ pressed }) => [styles.dropdownButton, pressed && styles.pressed]}
            >
              <Text style={styles.valueLabel}>
                {categories.find((category) => category.id === selectedCategoryId)?.name ??
                  'Select a category'}
              </Text>
              <Text style={styles.dropdownChevron}>
                {isCategoryDropdownOpen ? '▲' : '▼'}
              </Text>
            </Pressable>
            {isCategoryDropdownOpen && (
              <View style={styles.dropdownOptions}>
                {categories.map((category) => (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selectedCategoryId === category.id }}
                    key={category.id}
                    onPress={() => {
                      setSelectedCategoryId(category.id);
                      setIsCategoryDropdownOpen(false);
                    }}
                    style={({ pressed }) => [styles.dropdownOption, pressed && styles.pressed]}
                  >
                    <Text style={styles.valueLabel}>{category.name}</Text>
                  </Pressable>
                ))}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setCategoryError(null);
                    setIsCategoryModalVisible(true);
                  }}
                  style={({ pressed }) => [styles.dropdownOption, pressed && styles.pressed]}
                >
                  <Text style={styles.addCategoryLabel}>+ Add custom category</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.fieldLabel}>Task name</Text>
            <TextInput
              accessibilityLabel="Suggested task"
              autoFocus
              onChangeText={(text) => {
                setEditedTask(text);
                setEditError(null);
              }}
              onSubmitEditing={saveEditedTask}
              editable={!isSavingCategory}
              placeholder="What do you need to do?"
              placeholderTextColor={Colors.textSecondary}
              returnKeyType="done"
              style={styles.input}
              value={editedTask}
            />
            <Text style={styles.fieldLabel}>Due date (required)</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setDraftDueDate(dueDate ?? new Date());
                setShowDatePicker(true);
              }}
              style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}
            >
              <Text style={styles.valueLabel}>
                {dueDate ? dueDate.toLocaleDateString() : 'Choose a due date'}
              </Text>
            </Pressable>
            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                accentColor={Colors.primary}
                display="default"
                mode="date"
                onDismiss={() => setShowDatePicker(false)}
                onValueChange={(_event, date) => {
                  setDueDate(date ?? null);
                  setShowDatePicker(false);
                }}
                value={draftDueDate}
              />
            )}
            {editError && (
              <Text accessibilityRole="alert" style={styles.error}>
                {editError}
              </Text>
            )}
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={closeTaskEditor}
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              >
                <Text style={styles.cancelLabel}>Cancel</Text>
              </Pressable>
              <ActionButton disabled={false} label="Save" onPress={saveEditedTask} />
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        onRequestClose={closeCategoryModal}
        transparent
        visible={isCategoryModalVisible}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>New category</Text>
            <TextInput
              accessibilityLabel="New category name"
              autoFocus
              editable={!isSavingCategory}
              onChangeText={setNewCategoryName}
              onSubmitEditing={addCategory}
              placeholder="Category name"
              placeholderTextColor={Colors.textSecondary}
              returnKeyType="done"
              style={styles.input}
              value={newCategoryName}
            />
            {categoryError && (
              <Text accessibilityRole="alert" style={styles.error}>
                {categoryError}
              </Text>
            )}
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                disabled={isSavingCategory}
                onPress={closeCategoryModal}
                style={({ pressed }) => [
                  styles.cancelButton,
                  (pressed || isSavingCategory) && styles.pressed,
                ]}
              >
                <Text style={styles.cancelLabel}>Cancel</Text>
              </Pressable>
              <ActionButton
                disabled={isSavingCategory}
                label={isSavingCategory ? 'Adding...' : 'Add'}
                onPress={addCategory}
              />
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
        transparent
        visible={showDatePicker && Platform.OS === 'ios'}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>Choose due date</Text>
            <DateTimePicker
              accentColor={Colors.primary}
              display="spinner"
              mode="date"
              onValueChange={(_event, date) => setDraftDueDate(date)}
              value={draftDueDate}
            />
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowDatePicker(false)}
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              >
                <Text style={styles.cancelLabel}>Cancel</Text>
              </Pressable>
              <ActionButton
                disabled={false}
                label="Done"
                onPress={() => {
                  setDueDate(draftDueDate);
                  setShowDatePicker(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ActionButton({
  disabled,
  label,
  onPress,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.submitButton,
        (pressed || disabled) && styles.pressed,
      ]}
    >
      <Text style={styles.submitLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSizes.subtitle,
    fontWeight: '600',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },
  input: {
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.text,
    fontSize: FontSizes.body,
    padding: Spacing.sm,
  },
  multilineInput: {
    minHeight: 140,
  },
  modelStatus: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  submitLabel: {
    color: '#FFFFFF',
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  suggestions: {
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
    paddingTop: Spacing.md,
  },
  taskOption: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  fieldLabel: {
    color: Colors.text,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  valueLabel: {
    color: Colors.text,
    fontSize: FontSizes.body,
  },
  dropdownButton: {
    alignItems: 'center',
    backgroundColor: '#F4F7F2',
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dropdownChevron: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
  },
  dropdownOptions: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownOption: {
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  addCategoryLabel: {
    color: Colors.primary,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  dateButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F4F7F2',
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  taskSelect: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    minWidth: 0,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: '#E8F3E5',
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.sm,
  },
  editLabel: {
    color: Colors.primary,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  checkbox: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: 4,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxMark: {
    color: '#FFFFFF',
    fontSize: FontSizes.body,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  suggestion: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSizes.body,
  },
  error: {
    color: Colors.error,
    fontSize: FontSizes.body,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.md,
    maxWidth: 420,
    padding: Spacing.md,
    width: '100%',
  },
  modalActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: Spacing.md,
  },
  cancelLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
  },
});

function formatDateForDatabase(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateFromDatabase(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
