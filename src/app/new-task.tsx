import { useCallback, useState } from 'react';
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
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors, FontSizes, Spacing } from './styles/theme';

type Category = {
  id: number;
  name: string;
};

export default function NewTaskScreen() {
  const db = useSQLiteContext();
  const [taskName, setTaskName] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [draftDueDate, setDraftDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const savedCategories = await db.getAllAsync<Category>(
        'SELECT id, name FROM Category ORDER BY id'
      );
      setCategories(savedCategories);
      setSelectedCategoryId((current) => current ?? savedCategories[0]?.id ?? null);
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

  async function createTask() {
    const name = taskName.trim();
    if (!name) {
      setError('Enter a task name first.');
      return;
    }
    if (!dueDate) {
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
      await db.runAsync(
        'INSERT INTO Tasks (name, category_id, due_date) VALUES (?, ?, ?)',
        name,
        selectedCategoryId,
        formatDateForDatabase(dueDate)
      );
      router.replace('/(tabs)');
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
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.heading}>New task</Text>

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
          autoFocus
          editable={!isWorking}
          onChangeText={setTaskName}
          onSubmitEditing={createTask}
          placeholder="What do you need to do?"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="done"
          style={styles.input}
          value={taskName}
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

        {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <ActionButton
          disabled={isWorking}
          label={isWorking ? 'Creating...' : 'Create'}
          onPress={createTask}
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

function formatDateForDatabase(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
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
