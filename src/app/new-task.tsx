import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, Stack, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, FontSizes, Spacing } from '../styles/theme';

type Category = {
  id: number;
  name: string;
};

type SubtaskDraft = {
  key: string;        // stable React key, also for subtasks not saved yet
  id: number | null;  // null until the subtask is saved
  name: string;
  completed: boolean;
};

type SavedSubtask = {
  id: number;
  name: string;
  completed: number;
};

type SavedTask = {
  name: string;
  categoryId: number | null;
  dueDate: string | null;
  priority: number;
};

export default function NewTaskScreen() {
  const db = useSQLiteContext();
  // categoryId: opened from a category's + button, so pre-select it
  // taskId: opened by tapping a task, so this screen edits that task
  // backTitle: label for the back button (the page we came from)
  const { categoryId, categoryName, taskId, backTitle } = useLocalSearchParams<{
    categoryId?: string;
    categoryName?: string;
    taskId?: string;
    backTitle?: string;
  }>();
  const presetCategoryId = categoryId ? Number(categoryId) : null;
  const editingTaskId = taskId ? Number(taskId) : null;
  const isEditing = editingTaskId !== null;
  const [isLoadingTask, setIsLoadingTask] = useState(isEditing);
  const navigation = useNavigation();
  // ComponentRef gives the input's instance type (which has .focus())
  const taskNameInputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [taskName, setTaskName] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(presetCategoryId);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [draftDueDate, setDraftDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isPriority, setIsPriority] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>([]);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const nextSubtaskKey = useRef(0);

  const loadCategories = useCallback(async () => {
    try {
      const savedCategories = await db.getAllAsync<Category>(
        'SELECT id, name FROM Category ORDER BY id'
      );
      setCategories(savedCategories);
      setSelectedCategoryId((current) =>
        current !== null && savedCategories.some((category) => category.id === current)
          ? current
          : savedCategories[0]?.id ?? null
      );
    } catch (loadError) {
      console.error('Unable to load task categories:', loadError);
      setError('Task categories could not be loaded. Please try again.');
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void loadCategories();
    }, [loadCategories])
  );

  // For a new task, open the keyboard only after the slide-in animation ends.
  // Focusing during the animation (autoFocus) can leave the screen shifted up.
  useEffect(() => {
    if (isEditing) return;
    if (Platform.OS === 'web') {
      taskNameInputRef.current?.focus();
      return;
    }
    let didFocus = false;
    const focusInput = () => {
      if (didFocus) return;
      didFocus = true;
      taskNameInputRef.current?.focus();
    };
    const unsubscribe = navigation.addListener(
      'transitionEnd' as never,
      ((event: { data?: { closing?: boolean } }) => {
        if (!event.data?.closing) focusInput();
      }) as never
    );
    // Fallback in case the transition event doesn't fire
    const timer = setTimeout(focusInput, 600);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [isEditing, navigation]);

  // In edit mode, fill the form with the task's saved values (once)
  useEffect(() => {
    if (editingTaskId === null) return;
    let isActive = true;
    (async () => {
      try {
        const task = await db.getFirstAsync<SavedTask>(
          `SELECT name, category_id AS categoryId, due_date AS dueDate, priority
          FROM Tasks WHERE id = ?`,
          editingTaskId
        );
        if (!isActive) return;
        if (!task) {
          setError('This task could not be found. It may have been deleted.');
          return;
        }
        setTaskName(task.name);
        if (task.categoryId !== null) setSelectedCategoryId(task.categoryId);
        setDueDate(task.dueDate ? parseDatabaseDate(task.dueDate) : null);
        setIsPriority(Boolean(task.priority));
        const savedSubtasks = await db.getAllAsync<SavedSubtask>(
          'SELECT id, name, completed FROM Subtasks WHERE task_id = ? ORDER BY position, id',
          editingTaskId
        );
        if (!isActive) return;
        setSubtasks(
          savedSubtasks.map((subtask) => ({
            key: `saved-${subtask.id}`,
            id: subtask.id,
            name: subtask.name,
            completed: Boolean(subtask.completed),
          }))
        );
      } catch (loadError) {
        console.error('Unable to load task:', loadError);
        if (isActive) setError('This task could not be loaded. Please try again.');
      } finally {
        if (isActive) setIsLoadingTask(false);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [db, editingTaskId]);

  function addSubtask() {
    const name = newSubtaskName.trim();
    if (!name) return;
    setSubtasks((current) => [
      ...current,
      { key: `new-${nextSubtaskKey.current++}`, id: null, name, completed: false },
    ]);
    setNewSubtaskName('');
  }

  function updateSubtask(key: string, changes: Partial<SubtaskDraft>) {
    setSubtasks((current) =>
      current.map((subtask) => (subtask.key === key ? { ...subtask, ...changes } : subtask))
    );
  }

  function removeSubtask(key: string) {
    setSubtasks((current) => current.filter((subtask) => subtask.key !== key));
  }

  async function saveTask() {
    const name = taskName.trim();
    if (!name) {
      setError('Enter a task name first.');
      return;
    }
    // Due date is required for new tasks; older tasks (e.g. from a brain dump)
    // may not have one, so editing doesn't force adding it
    if (!dueDate && !isEditing) {
      setError('Choose a due date first.');
      return;
    }
    if (selectedCategoryId === null) {
      setError('Choose a task category first.');
      return;
    }

    setIsWorking(true);
    setError(null);
    try {
      const dueDateValue = dueDate ? formatDateForDatabase(dueDate) : null;
      // Include a subtask still typed in the box, and drop any left blank
      const pendingName = newSubtaskName.trim();
      const subtasksToSave = [
        ...subtasks,
        ...(pendingName
          ? [{ key: 'pending', id: null, name: pendingName, completed: false }]
          : []),
      ]
        .map((subtask) => ({ ...subtask, name: subtask.name.trim() }))
        .filter((subtask) => subtask.name);

      // Task and subtasks are saved together: all or nothing
      await db.withTransactionAsync(async () => {
        let taskId: number;
        if (isEditing && editingTaskId !== null) {
          taskId = editingTaskId;
          await db.runAsync(
            'UPDATE Tasks SET name = ?, category_id = ?, due_date = ?, priority = ? WHERE id = ?',
            name,
            selectedCategoryId,
            dueDateValue,
            isPriority ? 1 : 0,
            taskId
          );
          // Delete subtasks that were removed in the form
          const keptIds = subtasksToSave
            .map((subtask) => subtask.id)
            .filter((id): id is number => id !== null);
          if (keptIds.length === 0) {
            await db.runAsync('DELETE FROM Subtasks WHERE task_id = ?', taskId);
          } else {
            await db.runAsync(
              `DELETE FROM Subtasks WHERE task_id = ? AND id NOT IN (${keptIds
                .map(() => '?')
                .join(', ')})`,
              taskId,
              ...keptIds
            );
          }
        } else {
          const result = await db.runAsync(
            'INSERT INTO Tasks (name, category_id, due_date, priority) VALUES (?, ?, ?, ?)',
            name,
            selectedCategoryId,
            dueDateValue,
            isPriority ? 1 : 0
          );
          taskId = result.lastInsertRowId;
        }

        // Save subtasks in the order shown on screen
        for (const [position, subtask] of subtasksToSave.entries()) {
          if (subtask.id !== null) {
            await db.runAsync(
              'UPDATE Subtasks SET name = ?, completed = ?, position = ? WHERE id = ? AND task_id = ?',
              subtask.name,
              subtask.completed ? 1 : 0,
              position,
              subtask.id,
              taskId
            );
          } else {
            await db.runAsync(
              'INSERT INTO Subtasks (task_id, name, completed, position) VALUES (?, ?, ?, ?)',
              taskId,
              subtask.name,
              subtask.completed ? 1 : 0,
              position
            );
          }
        }
      });
      if ((isEditing || presetCategoryId !== null) && router.canGoBack()) {
        // Go back to the page we came from so the change shows up there
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (saveError) {
      console.error('Unable to save task:', saveError);
      setError('The task could not be saved. Please try again.');
    } finally {
      setIsWorking(false);
    }
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

  return (
    <ScrollView
      // iOS: scroll the focused field above the keyboard, then return to the
      // normal position when the keyboard closes
      automaticallyAdjustKeyboardInsets
      // Keep content below the header and status bar
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
    >
      {/* Back button names the page you came from: a category, or the Add tab */}
      <Stack.Screen
        options={{
          headerBackTitle:
            backTitle ?? (presetCategoryId !== null ? categoryName ?? 'Back' : 'Add'),
          ...(isEditing && { title: 'Edit task' }),
        }}
      />
      <View style={styles.card}>
        <Text style={styles.heading}>{isEditing ? 'Edit task' : 'New task'}</Text>

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
          accessibilityLabel="Task name"
          ref={taskNameInputRef}
          editable={!isWorking}
          onChangeText={setTaskName}
          onSubmitEditing={saveTask}
          placeholder="What do you need to do?"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="done"
          style={styles.input}
          value={taskName}
        />

        <Text style={styles.fieldLabel}>{isEditing ? 'Due date' : 'Due date (required)'}</Text>
        {Platform.OS === 'web' ? (
          // The native date picker doesn't exist on web, so use the browser's own
          <WebDateInput disabled={isWorking} onChange={setDueDate} value={dueDate} />
        ) : (
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
        )}
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

        <Text style={styles.fieldLabel}>Subtasks</Text>
        {subtasks.length > 0 && (
          <View style={styles.subtaskList}>
            {subtasks.map((subtask, index) => (
              <View key={subtask.key} style={styles.subtaskRow}>
                <Pressable
                  accessibilityLabel={
                    subtask.completed
                      ? `Mark ${subtask.name} as not done`
                      : `Mark ${subtask.name} as done`
                  }
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: subtask.completed, disabled: isWorking }}
                  disabled={isWorking}
                  hitSlop={Spacing.xs}
                  onPress={() => updateSubtask(subtask.key, { completed: !subtask.completed })}
                  style={({ pressed }) => [
                    styles.subtaskCheckbox,
                    subtask.completed && styles.subtaskCheckboxChecked,
                    pressed && styles.pressed,
                  ]}
                >
                  {subtask.completed && (
                    <MaterialCommunityIcons color={Colors.onPrimary} name="check" size={16} />
                  )}
                </Pressable>
                <TextInput
                  accessibilityLabel={`Subtask ${index + 1}`}
                  editable={!isWorking}
                  onChangeText={(text) => updateSubtask(subtask.key, { name: text })}
                  placeholder="Subtask name"
                  placeholderTextColor={Colors.textSecondary}
                  style={[
                    styles.input,
                    styles.subtaskInput,
                    subtask.completed && styles.subtaskInputDone,
                  ]}
                  value={subtask.name}
                />
                <Pressable
                  accessibilityLabel={`Remove subtask ${subtask.name}`}
                  accessibilityRole="button"
                  disabled={isWorking}
                  hitSlop={Spacing.xs}
                  onPress={() => removeSubtask(subtask.key)}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <MaterialCommunityIcons
                    color={Colors.textSecondary}
                    name="close"
                    size={22}
                  />
                </Pressable>
              </View>
            ))}
          </View>
        )}
        <View style={styles.subtaskRow}>
          <TextInput
            accessibilityLabel="New subtask"
            editable={!isWorking}
            onChangeText={setNewSubtaskName}
            onSubmitEditing={addSubtask}
            placeholder="Add a subtask (e.g. Make bed)"
            placeholderTextColor={Colors.textSecondary}
            returnKeyType="done"
            // Keep the keyboard open so several subtasks can be typed in a row
            submitBehavior="submit"
            style={[styles.input, styles.subtaskInput]}
            value={newSubtaskName}
          />
          <Pressable
            accessibilityLabel="Add subtask"
            accessibilityRole="button"
            disabled={isWorking || !newSubtaskName.trim()}
            hitSlop={Spacing.xs}
            onPress={addSubtask}
            style={({ pressed }) => [
              styles.subtaskAddButton,
              (pressed || isWorking || !newSubtaskName.trim()) && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons color={Colors.onPrimary} name="plus" size={22} />
          </Pressable>
        </View>

        <View style={styles.priorityRow}>
          <Pressable
            accessibilityLabel="Priority task"
            accessibilityRole="togglebutton"
            accessibilityState={{ checked: isPriority, disabled: isWorking }}
            disabled={isWorking}
            hitSlop={Spacing.sm}
            onPress={() => setIsPriority((current) => !current)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <MaterialCommunityIcons
              color={isPriority ? Colors.primary : Colors.textSecondary}
              name={isPriority ? 'star' : 'star-outline'}
              size={36}
            />
          </Pressable>
          <View style={styles.priorityText}>
            <Text style={styles.fieldLabel}>
              {isPriority ? 'Priority task' : 'Mark as priority'}
            </Text>
            <Text style={styles.priorityHint}>Priority tasks show on the Home page</Text>
          </View>
        </View>

        {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <ActionButton
          disabled={isWorking || isLoadingTask}
          label={
            isEditing
              ? isWorking ? 'Saving...' : 'Save changes'
              : isWorking ? 'Creating...' : 'Create'
          }
          onPress={saveTask}
        />
      </View>
      <Modal
        animationType="fade"
        onRequestClose={closeCategoryModal}
        transparent
        visible={isCategoryModalVisible}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.heading}>New category</Text>
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
            <Text style={styles.heading}>Choose due date</Text>
            <DateTimePicker
              accentColor={Colors.primary}
              display="inline"
              mode="date"
              onValueChange={(_event, date) => setDraftDueDate(date)}
              themeVariant="light"
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
    </ScrollView>
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
      style={({ pressed }) => [styles.submitButton, (pressed || disabled) && styles.pressed]}
    >
      <Text style={styles.submitLabel}>{label}</Text>
    </Pressable>
  );
}

// Browser date input, used only on web
function WebDateInput({
  disabled,
  onChange,
  value,
}: {
  disabled: boolean;
  onChange: (date: Date | null) => void;
  value: Date | null;
}) {
  return createElement('input', {
    'aria-label': 'Due date',
    disabled,
    type: 'date',
    value: value ? formatDateForDatabase(value) : '',
    onChange: (event: { target: { value: string } }) => {
      const text = event.target.value; // "YYYY-MM-DD" or ""
      if (!text) {
        onChange(null);
        return;
      }
      const [year, month, day] = text.split('-').map(Number);
      onChange(new Date(year, month - 1, day));
    },
    style: {
      alignSelf: 'flex-start',
      backgroundColor: '#F4F7F2',
      border: `1px solid ${Colors.border}`,
      borderRadius: 8,
      color: Colors.text,
      fontFamily: 'inherit',
      fontSize: FontSizes.body,
      padding: `${Spacing.sm}px ${Spacing.md}px`,
    },
  });
}

// "YYYY-MM-DD" -> Date in local time (new Date("YYYY-MM-DD") would use UTC
// and can show the day before)
function parseDatabaseDate(text: string) {
  const [year, month, day] = text.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateForDatabase(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  subtaskList: {
    gap: Spacing.sm,
  },
  subtaskRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  subtaskCheckbox: {
    alignItems: 'center',
    borderColor: Colors.primary,
    borderRadius: 5,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  subtaskCheckboxChecked: {
    backgroundColor: Colors.primary,
  },
  subtaskInput: {
    flex: 1,
  },
  subtaskInputDone: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  subtaskAddButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  priorityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityText: {
    flex: 1,
    gap: Spacing.xs,
  },
  priorityHint: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
  },
  content: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  heading: {
    color: Colors.text,
    fontSize: FontSizes.heading,
    fontWeight: 'bold',
  },
  fieldLabel: {
    color: Colors.text,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  input: {
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.text,
    fontSize: FontSizes.body,
    padding: Spacing.sm,
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
  valueLabel: {
    color: Colors.text,
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
  addCategoryLabel: {
    color: Colors.primary,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  cancelButton: {
    padding: Spacing.sm,
  },
  cancelLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
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
  pressed: {
    opacity: 0.7,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.md,
  },
  submitLabel: {
    color: '#FFFFFF',
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  error: {
    color: Colors.error,
    fontSize: FontSizes.body,
  },
});