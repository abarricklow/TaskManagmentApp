import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors, FontSizes, Spacing } from '../styles/theme';

type SuggestedTask = {
  name: string;
  categoryId: number | null;
  dueDate: string | null;
};

type Category = { id: number; name: string };

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [editedTask, setEditedTask] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategoryOpen, setSelectedCategoryOpen] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    void db
      .getAllAsync<Category>('SELECT id, name FROM Category ORDER BY id')
      .then((rows) => {
        if (isMounted) setCategories(rows);
      })
      .catch(() => {
        if (isMounted) setError('Task categories could not be loaded. Please try again.');
      });
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
        throw new Error(typeof body.error === 'string' ? body.error : 'Unable to reach the task breakdown service.');
      }
      const tasks = Array.isArray(body.tasks)
        ? body.tasks
            .filter((task): task is string => typeof task === 'string')
            .map((task) => task.trim())
            .filter(Boolean)
            .slice(0, 20)
        : [];
      if (tasks.length === 0) {
        throw new Error('The task breakdown service returned no tasks.');
      }
      setSuggestedTasks(tasks.map((name) => ({ name, categoryId: null, dueDate: null })));
      setSelectedTasks(new Set(tasks.map((_task, index) => index)));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to break down the brain dump.');
    } finally {
      setIsGenerating(false);
      onWorkingChange(false);
    }
  }

  function openTaskEditor(index: number) {
    const task = suggestedTasks[index];
    setEditingTaskIndex(index);
    setEditedTask(task.name);
    setSelectedCategoryId(task.categoryId ?? categories[0]?.id ?? null);
    setDueDate(task.dueDate ?? '');
    setSelectedCategoryOpen(false);
    setEditError(null);
  }

  function saveEditedTask() {
    const name = editedTask.trim();
    if (!name) {
      setEditError('Enter a task name first.');
      return;
    }
    if (selectedCategoryId === null) {
      setEditError('Choose a task category first.');
      return;
    }
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      setEditError('Use a due date in YYYY-MM-DD format.');
      return;
    }
    if (editingTaskIndex === null) return;

    setSuggestedTasks((current) =>
      current.map((task, index) =>
        index === editingTaskIndex
          ? { name, categoryId: selectedCategoryId, dueDate: dueDate || null }
          : task
      )
    );
    setEditingTaskIndex(null);
  }

  async function addCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      setEditError('Enter a category name first.');
      return;
    }
    setIsSavingCategory(true);
    try {
      await db.runAsync('INSERT OR IGNORE INTO Category (name) VALUES (?)', name);
      const category = await db.getFirstAsync<Category>(
        'SELECT id, name FROM Category WHERE name = ?',
        name
      );
      if (!category) throw new Error('The category could not be found after saving.');
      setCategories((current) =>
        current.some((item) => item.id === category.id) ? current : [...current, category]
      );
      setSelectedCategoryId(category.id);
      setNewCategoryName('');
      setCategoryModalOpen(false);
    } catch (categoryError) {
      setEditError(categoryError instanceof Error ? categoryError.message : 'The category could not be saved.');
    } finally {
      setIsSavingCategory(false);
    }
  }

  async function saveSuggestedTasks() {
    const tasks = suggestedTasks.filter((_task, index) => selectedTasks.has(index));
    if (tasks.length === 0) {
      setError('Select at least one task to add.');
      return;
    }
    setIsSaving(true);
    onWorkingChange(true);
    setError(null);
    try {
      await onSaveTasks(tasks);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The subtasks could not be saved.');
    } finally {
      setIsSaving(false);
      onWorkingChange(false);
    }
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
        style={styles.input}
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
                onPress={() => setSelectedTasks((current) => {
                  const next = new Set(current);
                  if (next.has(index)) next.delete(index);
                  else next.add(index);
                  return next;
                })}
                style={styles.taskSelect}
              >
                <View style={[styles.checkbox, selectedTasks.has(index) && styles.checkboxSelected]}>
                  {selectedTasks.has(index) && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.suggestion}>{task.name}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={`Edit ${task.name}`}
                accessibilityRole="button"
                disabled={isWorking}
                onPress={() => openTaskEditor(index)}
                style={styles.editButton}
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
        onRequestClose={() => setEditingTaskIndex(null)}
        transparent
        visible={editingTaskIndex !== null}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>Edit suggested task</Text>
            <Text style={styles.fieldLabel}>Category</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelectedCategoryOpen((open) => !open)}
              style={styles.dropdownButton}
            >
              <Text style={styles.valueLabel}>
                {categories.find((category) => category.id === selectedCategoryId)?.name ?? 'Select a category'}
              </Text>
              <Text>{selectedCategoryOpen ? '▲' : '▼'}</Text>
            </Pressable>
            {selectedCategoryOpen && (
              <View style={styles.dropdownOptions}>
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => {
                      setSelectedCategoryId(category.id);
                      setSelectedCategoryOpen(false);
                    }}
                    style={styles.dropdownOption}
                  >
                    <Text style={styles.valueLabel}>{category.name}</Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => setCategoryModalOpen(true)}
                  style={styles.dropdownOption}
                >
                  <Text style={styles.addCategoryLabel}>+ Add custom category</Text>
                </Pressable>
              </View>
            )}
            <Text style={styles.fieldLabel}>Task name</Text>
            <TextInput
              accessibilityLabel="Suggested task"
              onChangeText={setEditedTask}
              style={styles.input}
              value={editedTask}
            />
            <Text style={styles.fieldLabel}>Due date</Text>
            <TextInput
              accessibilityLabel="Due date"
              autoCapitalize="none"
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
              style={styles.shortInput}
              value={dueDate}
            />
            {editError && <Text accessibilityRole="alert" style={styles.error}>{editError}</Text>}
            <View style={styles.modalActions}>
              <Pressable onPress={() => setEditingTaskIndex(null)} style={styles.cancelButton}>
                <Text style={styles.cancelLabel}>Cancel</Text>
              </Pressable>
              <ActionButton disabled={false} label="Save" onPress={saveEditedTask} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setCategoryModalOpen(false)}
        transparent
        visible={categoryModalOpen}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>New category</Text>
            <TextInput
              accessibilityLabel="New category name"
              editable={!isSavingCategory}
              onChangeText={setNewCategoryName}
              placeholder="Category name"
              style={styles.input}
              value={newCategoryName}
            />
            {editError && <Text accessibilityRole="alert" style={styles.error}>{editError}</Text>}
            <View style={styles.modalActions}>
              <Pressable onPress={() => setCategoryModalOpen(false)} style={styles.cancelButton}>
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
    </View>
  );
}

function ActionButton({ disabled, label, onPress }: { disabled: boolean; label: string; onPress: () => void }) {
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

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderColor: Colors.border, borderRadius: 12, borderWidth: 1, gap: Spacing.md, padding: Spacing.md },
  sectionTitle: { color: Colors.text, fontSize: FontSizes.subtitle, fontWeight: '600' },
  description: { color: Colors.textSecondary, fontSize: FontSizes.body },
  input: { borderColor: Colors.border, borderRadius: 8, borderWidth: 1, color: Colors.text, fontSize: FontSizes.body, minHeight: 140, padding: Spacing.sm, textAlignVertical: 'top' },
  shortInput: { borderColor: Colors.border, borderRadius: 8, borderWidth: 1, color: Colors.text, fontSize: FontSizes.body, minHeight: 44, padding: Spacing.sm },
  submitButton: { alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 8, padding: Spacing.md },
  submitLabel: { color: '#fff', fontSize: FontSizes.body, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  error: { color: Colors.error, fontSize: FontSizes.body },
  suggestions: { borderTopColor: Colors.border, borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.sm, paddingTop: Spacing.md },
  taskOption: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm },
  taskSelect: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: Spacing.sm, minWidth: 0 },
  checkbox: { alignItems: 'center', borderColor: Colors.border, borderRadius: 4, borderWidth: 1, height: 22, justifyContent: 'center', width: 22 },
  checkboxSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkboxMark: { color: '#fff', fontSize: FontSizes.body, fontWeight: 'bold', lineHeight: 20 },
  suggestion: { color: Colors.text, flex: 1, fontSize: FontSizes.body },
  editButton: { alignItems: 'center', backgroundColor: '#E8F3E5', borderColor: Colors.border, borderRadius: 8, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: Spacing.sm },
  editLabel: { color: Colors.primary, fontSize: FontSizes.body, fontWeight: '600' },
  fieldLabel: { color: Colors.text, fontSize: FontSizes.body, fontWeight: '600' },
  valueLabel: { color: Colors.text, fontSize: FontSizes.body },
  dropdownButton: { alignItems: 'center', backgroundColor: '#F4F7F2', borderColor: Colors.border, borderRadius: 8, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.sm },
  dropdownOptions: { backgroundColor: '#fff', borderColor: Colors.border, borderRadius: 8, borderWidth: 1 },
  dropdownOption: { borderBottomColor: Colors.border, borderBottomWidth: StyleSheet.hairlineWidth, padding: Spacing.sm },
  addCategoryLabel: { color: Colors.primary, fontSize: FontSizes.body, fontWeight: '600' },
  modalBackdrop: { alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.45)', flex: 1, justifyContent: 'center', padding: Spacing.md },
  modalCard: { backgroundColor: '#fff', borderColor: Colors.border, borderRadius: 12, borderWidth: 1, gap: Spacing.sm, maxWidth: 420, padding: Spacing.md, width: '100%' },
  modalActions: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end' },
  cancelButton: { padding: Spacing.md },
  cancelLabel: { color: Colors.textSecondary, fontSize: FontSizes.body },
});
