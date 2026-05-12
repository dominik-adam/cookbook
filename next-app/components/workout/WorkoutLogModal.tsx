import { useState, useEffect, useCallback } from 'react';
import styles from '@/styles/workout.module.css';
import type { WorkoutSession, ExerciseInput } from '@/types/workout';

interface WorkoutLogModalProps {
  isOpen: boolean;
  sessionToEdit: WorkoutSession | null;
  exerciseSuggestions: string[];
  defaultDate?: string;
  onClose: () => void;
  onSaved: () => void;
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function emptyExercise(): ExerciseInput {
  return {
    exerciseName: '',
    sets: null,
    reps: null,
    weight: null,
    duration: null,
    distance: null,
    notes: null,
  };
}

export default function WorkoutLogModal({
  isOpen,
  sessionToEdit,
  exerciseSuggestions,
  defaultDate,
  onClose,
  onSaved,
}: WorkoutLogModalProps) {
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<ExerciseInput[]>([emptyExercise()]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (sessionToEdit) {
      setDate(sessionToEdit.date.slice(0, 10));
      setNotes(sessionToEdit.notes ?? '');
      setExercises(
        sessionToEdit.exercises.length > 0
          ? sessionToEdit.exercises.map((e) => ({
              exerciseName: e.exerciseName,
              sets: e.sets ?? null,
              reps: e.reps ?? null,
              weight: e.weight ?? null,
              duration: e.duration ?? null,
              distance: e.distance ?? null,
              notes: e.notes ?? null,
            }))
          : [emptyExercise()]
      );
    } else {
      setDate(defaultDate ?? todayStr());
      setNotes('');
      setExercises([emptyExercise()]);
    }
    setError('');
    setActiveSuggestionIndex(null);
  }, [isOpen, sessionToEdit, defaultDate]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const updateExercise = (index: number, field: keyof ExerciseInput, value: string) => {
    setExercises((prev) => {
      const updated = [...prev];
      const numFields = ['sets', 'reps', 'weight', 'duration', 'distance'] as const;

      if (numFields.includes(field as typeof numFields[number])) {
        const num = parseFloat(value);
        (updated[index] as any)[field] = value === '' ? null : isNaN(num) ? null : num;
      } else {
        (updated[index] as any)[field] = value;
      }

      return updated;
    });
  };

  const addExercise = () => {
    setExercises((prev) => [...prev, emptyExercise()]);
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const getFilteredSuggestions = (index: number): string[] => {
    const name = exercises[index]?.exerciseName ?? '';
    if (!name) return exerciseSuggestions.slice(0, 8);
    return exerciseSuggestions
      .filter((s) => s.toLowerCase().includes(name.toLowerCase()))
      .slice(0, 8);
  };

  const handleSave = async () => {
    if (!date) {
      setError('Please select a date');
      return;
    }

    const filledExercises = exercises.filter((e) => e.exerciseName.trim() !== '');
    if (filledExercises.length === 0) {
      setError('Add at least one exercise');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const url = sessionToEdit ? '/api/update-workout' : '/api/log-workout';
      const body = sessionToEdit
        ? { sessionId: sessionToEdit.id, date, notes: notes || null, exercises: filledExercises }
        : { date, notes: notes || null, exercises: filledExercises };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to save workout');
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError('Network error, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`${styles.modalWindow} ${styles.modalWindowOpened}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modalContent} role="dialog" aria-modal="true">
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>
            {sessionToEdit ? 'Edit Workout' : 'Log Workout'}
          </span>
          <button className={styles.modalCloseButton} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Date</label>
            <input
              type="date"
              className={styles.formInput}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Session notes (optional)</label>
            <textarea
              className={styles.formTextarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Feeling strong today"
              rows={2}
            />
          </div>

          <div className={styles.exercisesSection}>
            <div className={styles.exercisesSectionTitle}>Exercises</div>

            {exercises.map((exercise, index) => {
              const filtered = getFilteredSuggestions(index);
              const showDropdown = activeSuggestionIndex === index && filtered.length > 0;

              return (
                <div key={index} className={styles.exerciseRow}>
                  <div className={styles.exerciseRowHeader}>
                    <div className={styles.exerciseNameWrapper}>
                      <input
                        type="text"
                        className={styles.exerciseNameInput}
                        placeholder="Exercise name *"
                        value={exercise.exerciseName}
                        onChange={(e) => updateExercise(index, 'exerciseName', e.target.value)}
                        onFocus={() => setActiveSuggestionIndex(index)}
                        onBlur={() => {
                          setTimeout(() => setActiveSuggestionIndex(null), 200);
                        }}
                        autoComplete="off"
                      />
                      {showDropdown && (
                        <div className={styles.suggestionDropdown}>
                          {filtered.map((s) => (
                            <div
                              key={s}
                              className={styles.suggestionItem}
                              onMouseDown={() => {
                                updateExercise(index, 'exerciseName', s);
                                setActiveSuggestionIndex(null);
                              }}
                            >
                              {s}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {exercises.length > 1 && (
                      <button
                        className={styles.removeExerciseButton}
                        onClick={() => removeExercise(index)}
                        type="button"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className={styles.exerciseFields}>
                    <div className={styles.exerciseFieldGroup}>
                      <label className={styles.exerciseFieldLabel}>Sets</label>
                      <input
                        type="number"
                        className={styles.exerciseFieldInput}
                        placeholder="–"
                        min="1"
                        value={exercise.sets ?? ''}
                        onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                      />
                    </div>

                    <div className={styles.exerciseFieldGroup}>
                      <label className={styles.exerciseFieldLabel}>Reps</label>
                      <input
                        type="number"
                        className={styles.exerciseFieldInput}
                        placeholder="–"
                        min="1"
                        value={exercise.reps ?? ''}
                        onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                      />
                    </div>

                    <div className={styles.exerciseFieldGroup}>
                      <label className={styles.exerciseFieldLabel}>Weight (kg)</label>
                      <input
                        type="number"
                        className={styles.exerciseFieldInput}
                        placeholder="–"
                        min="0"
                        step="0.5"
                        value={exercise.weight ?? ''}
                        onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                      />
                    </div>

                    <div className={styles.exerciseFieldGroup}>
                      <label className={styles.exerciseFieldLabel}>Duration (min)</label>
                      <input
                        type="number"
                        className={styles.exerciseFieldInput}
                        placeholder="–"
                        min="1"
                        value={exercise.duration ?? ''}
                        onChange={(e) => updateExercise(index, 'duration', e.target.value)}
                      />
                    </div>

                    <div className={styles.exerciseFieldGroup}>
                      <label className={styles.exerciseFieldLabel}>Distance (km)</label>
                      <input
                        type="number"
                        className={styles.exerciseFieldInput}
                        placeholder="–"
                        min="0"
                        step="0.1"
                        value={exercise.distance ?? ''}
                        onChange={(e) => updateExercise(index, 'distance', e.target.value)}
                      />
                    </div>

                    <div className={styles.exerciseFieldGroup}>
                      <label className={styles.exerciseFieldLabel}>Notes</label>
                      <input
                        type="text"
                        className={styles.exerciseNotesInput}
                        placeholder="–"
                        value={exercise.notes ?? ''}
                        onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              className={styles.addExerciseButton}
              onClick={addExercise}
              type="button"
            >
              + Add Exercise
            </button>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.modalFooter}>
            <button
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              className={styles.saveButton}
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'Saving…' : 'Save Workout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
