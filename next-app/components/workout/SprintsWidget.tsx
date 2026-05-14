import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/planner.module.css';
import type { DailyPlanSettings, ExerciseSchedule, ProgressionSuggestion } from '@/types/planner';
import { HOLD_TO_RESET_MS } from '@/lib/uiConfig';

interface SprintsWidgetProps {
  schedule: ExerciseSchedule;
  settings: DailyPlanSettings | null;
  onUpdated: () => void;
}

const BG          = 'linear-gradient(145deg, #0a1a4e 0%, #0d2a80 100%)';
const BG_COMPLETE = 'linear-gradient(145deg, #0a4a2d 0%, #1a7a4a 100%)';

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export default function SprintsWidget({ schedule, settings, onUpdated }: SprintsWidgetProps) {
  const log     = schedule.exerciseLog;
  const planned = log?.sprintsPlanned ?? settings?.sprintCount ?? 8;

  const [sprintsDone, setSprintsDone] = useState(log?.sprintsDone ?? 0);
  const [saveStatus,  setSaveStatus]  = useState<SaveStatus>('idle');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isHolding, setIsHolding]     = useState(false);
  const [error, setError]             = useState('');
  const [progression, setProgression] = useState<ProgressionSuggestion>(null);

  // Notes kept but not shown in UI — preserved on every save
  const notesRef = useRef(log?.notes ?? '');

  const fullyCompleted = planned > 0 && sprintsDone >= planned;
  const pct = Math.min(sprintsDone / planned, 1);

  // ── Auto-save debounce ────────────────────────────────────────────────────
  const latestRef    = useRef({ sprintsDone, fullyCompleted });
  latestRef.current  = { sprintsDone, fullyCompleted };
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didMount     = useRef(false);
  const isResetting  = useRef(false);

  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    if (isResetting.current) { isResetting.current = false; return; } // hold-to-reset: skip save
    setSaveStatus('pending');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const { sprintsDone, fullyCompleted } = latestRef.current;
      setSaveStatus('saving');
      try {
        const res = await fetch('/api/planner/exercise/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduleId: schedule.id,
            sprintsDone,
            notes: notesRef.current || undefined,
            fullyCompleted,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSaveStatus('error');
          setError(data.error ?? 'Save failed');
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
    }, 600);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprintsDone]);

  // ── Hold-to-reset (3 s) ───────────────────────────────────────────────────
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHold   = useRef(false);

  function handlePointerDown() {
    didHold.current = false;
    setIsHolding(true);
    holdTimer.current = setTimeout(async () => {
      didHold.current = true;
      setIsHolding(false);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current); // cancel pending save
      isResetting.current = true;
      setSprintsDone(0);
      setSaveStatus('idle');
      if (log) {
        await fetch('/api/planner/exercise/log', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduleId: schedule.id }),
        });
      }
      onUpdated();
    }, HOLD_TO_RESET_MS);
  }

  function handlePointerUp() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setIsHolding(false);
    if (!didHold.current) setSprintsDone((n) => n + 1);
  }

  function handlePointerLeave() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setIsHolding(false);
  }

  // ── Reschedule ────────────────────────────────────────────────────────────
  async function handleReschedule(direction: 'prev' | 'next') {
    setIsRescheduling(true);
    try {
      const res = await fetch('/api/planner/exercise/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId: schedule.id, direction }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Cannot reschedule'); }
      else onUpdated();
    } catch {
      setError('Network error');
    } finally {
      setIsRescheduling(false);
    }
  }

  const alreadyLogged = !!log;

  return (
    <div
      className={`${styles.widgetCard} ${styles.widgetExercise}`}
      style={{ background: fullyCompleted ? BG_COMPLETE : BG, position: 'relative', cursor: 'pointer' }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      {/* Darkening overlay while holding */}
      {isHolding && <div className={styles.wHoldRipple} />}

      <div className={styles.wExerciseHeader}>
        <div className={styles.wExerciseTitleGroup}>
          <span className={styles.wExerciseLabel}>Sprints</span>
          <span className={styles.wExerciseWeight}>{sprintsDone} / {planned}</span>
        </div>

        <div className={styles.wExerciseActions}>
          {!alreadyLogged && (
            <>
              <button
                className={styles.wRescheduleBtn}
                title="Move to yesterday"
                disabled={isRescheduling}
                // stop pointer events reaching the card — prevents unwanted add/reset
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={() => handleReschedule('prev')}
              >←</button>
              <button
                className={styles.wRescheduleBtn}
                title="Move to tomorrow"
                disabled={isRescheduling}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={() => handleReschedule('next')}
              >→</button>
            </>
          )}
          <span className={styles.wSaveStatus} data-status={saveStatus}>
            {saveStatus === 'pending' && '…'}
            {saveStatus === 'saving'  && 'saving'}
            {saveStatus === 'saved'   && '✓'}
            {saveStatus === 'error'   && 'err'}
          </span>
        </div>
      </div>

      <div className={styles.wProgressBar}>
        <div className={styles.wProgressFill} style={{ width: `${pct * 100}%` }} />
      </div>
      <div className={styles.wSubLabel} style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.63rem', marginTop: 6 }}>
        tap +1 · hold 3 s to reset
      </div>

      {error && (
        <div style={{ color: 'rgba(255,120,120,0.9)', fontSize: '0.75rem', marginTop: 6 }}>{error}</div>
      )}

      {progression && (
        <div
          className={styles.progressionBanner}
          style={{ marginTop: 10 }}
          // prevent banner clicks from triggering the card's add/reset
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          <div className={styles.progressionMessage}>{progression.message}</div>
          <div className={styles.progressionActions}>
            <button className={styles.progressionDismiss} onClick={() => setProgression(null)}>Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
}
