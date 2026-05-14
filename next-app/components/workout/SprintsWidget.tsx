import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/planner.module.css';
import type { DailyPlanSettings, ExerciseSchedule, ProgressionSuggestion } from '@/types/planner';

interface SprintsWidgetProps {
  schedule: ExerciseSchedule;
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

export default function SprintsWidget({ schedule, settings, onUpdated }: SprintsWidgetProps) {
  const log = schedule.exerciseLog;
  const planned = log?.sprintsPlanned ?? settings?.sprintCount ?? 8;

  const [sprintsDone, setSprintsDone] = useState(log?.sprintsDone ?? 0);
  const [notes, setNotes] = useState(log?.notes ?? '');
  const [showNotes, setShowNotes] = useState(!!log?.notes);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [error, setError] = useState('');
  const [progression, setProgression] = useState<ProgressionSuggestion>(null);

  const fullyCompleted = planned > 0 && sprintsDone >= planned;
  const pct = Math.min(sprintsDone / planned, 1);

  // Always read the freshest state inside the debounce timer
  const latestRef = useRef({ sprintsDone, notes, fullyCompleted });
  latestRef.current = { sprintsDone, notes, fullyCompleted };

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }

    setSaveStatus('pending');
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      const { sprintsDone, notes, fullyCompleted } = latestRef.current;
      setSaveStatus('saving');
      try {
        const res = await fetch('/api/planner/exercise/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduleId: schedule.id,
            sprintsDone,
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
  }, [sprintsDone, notes]);

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

  return (
    <div className={`${styles.widgetCard} ${fullyCompleted ? styles.widgetCardComplete : ''}`}>
      <div className={styles.exerciseHeader}>
        <span className={styles.widgetTitle}>Sprints</span>
        <span className={styles.widgetValue}>{sprintsDone} / {planned}</span>
      </div>

      <div className={styles.progressBarOuter}>
        <div
          className={styles.progressBarInner}
          style={{ width: `${pct * 100}%`, backgroundColor: progressColor(pct) }}
        />
      </div>

      <div className={styles.sprintRow}>
        <input
          className={styles.sprintInput}
          type="number"
          min="0"
          value={sprintsDone}
          onChange={(e) => setSprintsDone(Math.max(0, parseInt(e.target.value) || 0))}
        />
        <span style={{ fontSize: '0.85rem', color: '#666' }}>sprints done</span>
      </div>

      <button className={styles.notesToggle} onClick={() => setShowNotes((p) => !p)}>
        {showNotes ? 'Hide notes' : 'Add notes'}
      </button>

      {showNotes && (
        <textarea
          className={styles.notesInput}
          placeholder="How did it feel?"
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
