import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/planner.module.css';
import type { DailyPlanSettings, ExerciseSchedule, ProgressionSuggestion } from '@/types/planner';

interface StrengthWidgetProps {
  schedule: ExerciseSchedule;
  exerciseType: 'PULLUPS' | 'DIPS';
  settings: DailyPlanSettings | null;
  onUpdated: () => void;
}

function progressColor(pct: number): string {
  if (pct <= 0) return '#e8e8e8';
  if (pct < 0.5) return '#f5c842';
  if (pct < 0.75) return '#f5a623';
  if (pct < 1) return '#7ec8a0';
  return '#3aa46c';
}

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export default function StrengthWidget({ schedule, exerciseType, settings, onUpdated }: StrengthWidgetProps) {
  const log = schedule.exerciseLog;

  const plannedSets   = log?.setsPlanned        ?? (exerciseType === 'PULLUPS' ? settings?.pullupSets        : settings?.dipSets)        ?? 4;
  const plannedReps   = log?.repsPerSetPlanned   ?? (exerciseType === 'PULLUPS' ? settings?.pullupRepsPerSet  : settings?.dipRepsPerSet)  ?? 6;
  const plannedWeight = log?.weightKgPlanned     ?? (exerciseType === 'PULLUPS' ? settings?.pullupWeightKg    : settings?.dipWeightKg)    ?? 10;

  const initResults = log?.setResults ?? Array(plannedSets).fill(0);

  const [setResults, setSetResults] = useState<number[]>(initResults);
  const [notes, setNotes] = useState(log?.notes ?? '');
  const [showNotes, setShowNotes] = useState(!!log?.notes);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [error, setError] = useState('');
  const [progression, setProgression] = useState<ProgressionSuggestion>(null);

  const totalDone    = setResults.reduce((s, r) => s + r, 0);
  const totalPlanned = plannedSets * plannedReps;
  const pct          = totalPlanned > 0 ? Math.min(totalDone / totalPlanned, 1) : 0;

  const fullyCompleted = plannedReps > 0 && setResults.every((r) => r >= plannedReps);

  // Always read the freshest state inside the debounce timer
  const latestRef = useRef({ setResults, notes, fullyCompleted });
  latestRef.current = { setResults, notes, fullyCompleted };

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }

    setSaveStatus('pending');
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      const { setResults, notes, fullyCompleted } = latestRef.current;
      setSaveStatus('saving');
      try {
        const res = await fetch('/api/planner/exercise/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduleId: schedule.id,
            setResults,
            weightKgUsed: plannedWeight,
            notes: notes || undefined,
            fullyCompleted,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSaveStatus('error');
          setError(data.error ?? 'Failed to save');
        } else {
          setSaveStatus('saved');
          setError('');
          if (data.progressionSuggestion) setProgression(data.progressionSuggestion);
          onUpdated();
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
      } catch {
        setSaveStatus('error');
        setError('Network error');
      }
    }, 1000);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setResults, notes]);

  function updateSet(idx: number, val: string) {
    const parsed = Math.max(0, parseInt(val) || 0);
    setSetResults((prev) => {
      const next = [...prev];
      next[idx] = parsed;
      return next;
    });
  }

  async function handleReschedule(direction: 'prev' | 'next') {
    setIsRescheduling(true);
    setError('');
    try {
      const res = await fetch('/api/planner/exercise/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId: schedule.id, direction }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Cannot reschedule');
      } else {
        onUpdated();
      }
    } catch {
      setError('Network error');
    } finally {
      setIsRescheduling(false);
    }
  }

  const alreadyLogged = !!log;
  const label = exerciseType === 'PULLUPS' ? 'Pullups' : 'Dips';

  return (
    <div className={`${styles.widgetCard} ${fullyCompleted ? styles.widgetCardComplete : ''}`}>
      <div className={styles.exerciseHeader}>
        <span className={styles.widgetTitle}>{label}</span>
        <span className={styles.widgetValue}>{totalDone} / {totalPlanned} reps</span>
      </div>

      <div className={styles.exercisePlan}>
        {plannedSets} sets × {plannedReps} reps @ +{plannedWeight}kg
      </div>

      <div className={styles.progressBarOuter}>
        <div
          className={styles.progressBarInner}
          style={{ width: `${pct * 100}%`, backgroundColor: progressColor(pct) }}
        />
      </div>

      {/* Per-set inputs */}
      <div className={styles.setRow}>
        {setResults.map((reps, i) => (
          <span key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span className={styles.setLabel}>Set {i + 1}</span>
            <input
              className={styles.setInput}
              type="number"
              min="0"
              value={reps || ''}
              placeholder="0"
              onChange={(e) => updateSet(i, e.target.value)}
            />
          </span>
        ))}
      </div>

      <button className={styles.notesToggle} onClick={() => setShowNotes((p) => !p)}>
        {showNotes ? 'Hide notes' : 'Add notes'}
      </button>

      {showNotes && (
        <textarea
          className={styles.notesInput}
          placeholder="Notes…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      )}

      <div className={styles.exerciseFooter}>
        {!alreadyLogged && (
          <>
            <button
              className={styles.rescheduleBtn}
              onClick={() => handleReschedule('prev')}
              disabled={isRescheduling}
              title="Move to yesterday"
            >←</button>
            <button
              className={styles.rescheduleBtn}
              onClick={() => handleReschedule('next')}
              disabled={isRescheduling}
              title="Move to tomorrow"
            >→</button>
          </>
        )}
        <span className={styles.autoSaveStatus} data-status={saveStatus}>
          {saveStatus === 'pending' && 'Unsaved…'}
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && '✓ Saved'}
          {saveStatus === 'error' && 'Save failed'}
        </span>
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}

      {progression && (
        <div className={styles.progressionBanner}>
          <div className={styles.progressionMessage}>{progression.message}</div>
          <div className={styles.progressionActions}>
            <button className={styles.progressionDismiss} onClick={() => setProgression(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
