import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/planner.module.css';
import type { DailyPlanSettings, ExerciseSchedule, ProgressionSuggestion } from '@/types/planner';
import { HOLD_TO_RESET_MS } from '@/lib/uiConfig';

interface StrengthWidgetProps {
  schedule: ExerciseSchedule;
  exerciseType: 'PULLUPS' | 'DIPS';
  settings: DailyPlanSettings | null;
  onUpdated: () => void;
}

const BG_PULLUPS = 'linear-gradient(145deg, #1a0a3e 0%, #2d1a6e 100%)';
const BG_DIPS    = 'linear-gradient(145deg, #0a2a1a 0%, #1a4a2a 100%)';
const BG_DONE    = 'linear-gradient(145deg, #0a4a2d 0%, #1a7a4a 100%)';

/** Box background based on reps vs planned target */
function setBoxBg(reps: number, planned: number): string {
  if (reps === 0) return 'rgba(255,255,255,0.07)';
  const pct = Math.min(reps / planned, 1);
  if (pct >= 1)    return 'rgba(58,164,108,0.85)';
  if (pct >= 0.75) return 'rgba(35,120,75,0.75)';
  if (pct >= 0.5)  return 'rgba(25,90,55,0.75)';
  return 'rgba(18,65,40,0.75)';
}

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export default function StrengthWidget({ schedule, exerciseType, settings, onUpdated }: StrengthWidgetProps) {
  const log = schedule.exerciseLog;

  const plannedSets   = log?.setsPlanned      ?? (exerciseType === 'PULLUPS' ? settings?.pullupSets      : settings?.dipSets)      ?? 4;
  const plannedReps   = log?.repsPerSetPlanned ?? (exerciseType === 'PULLUPS' ? settings?.pullupRepsPerSet: settings?.dipRepsPerSet) ?? 6;
  const plannedWeight = log?.weightKgPlanned   ?? (exerciseType === 'PULLUPS' ? settings?.pullupWeightKg  : settings?.dipWeightKg)   ?? 10;

  const [setResults, setSetResults] = useState<number[]>(
    log?.setResults ?? Array(plannedSets).fill(0)
  );
  const [saveStatus, setSaveStatus]   = useState<SaveStatus>('idle');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isHolding, setIsHolding]     = useState(false);
  const [error, setError]             = useState('');
  const [progression, setProgression] = useState<ProgressionSuggestion>(null);

  // Notes kept but not shown in UI (preserved on save)
  const notesRef = useRef(log?.notes ?? '');

  const fullyCompleted = plannedReps > 0 && setResults.every((r) => r >= plannedReps);
  const baseBg = fullyCompleted ? BG_DONE : (exerciseType === 'PULLUPS' ? BG_PULLUPS : BG_DIPS);

  // Auto-save debounce
  const latestRef = useRef({ setResults, fullyCompleted });
  latestRef.current = { setResults, fullyCompleted };
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didMount    = useRef(false);
  const isResetting = useRef(false);

  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    if (isResetting.current) { isResetting.current = false; return; } // hold-to-reset: skip save
    setSaveStatus('pending');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const { setResults, fullyCompleted } = latestRef.current;
      setSaveStatus('saving');
      try {
        const res = await fetch('/api/planner/exercise/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduleId: schedule.id,
            setResults,
            weightKgUsed: plannedWeight,
            notes: notesRef.current || undefined,
            fullyCompleted,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setSaveStatus('error'); setError(data.error ?? 'Save failed'); }
        else {
          setSaveStatus('saved');
          setError('');
          if (data.progressionSuggestion) setProgression(data.progressionSuggestion);
          onUpdated();
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
      } catch { setSaveStatus('error'); setError('Network error'); }
    }, 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setResults]);

  function adjustSet(idx: number, delta: number) {
    setSetResults((prev) => {
      const next = [...prev];
      next[idx] = Math.max(0, next[idx] + delta);
      return next;
    });
  }

  // Hold-to-reset (2 s) — resets all sets to 0
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
      setSetResults(Array(plannedSets).fill(0));
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
    if (!didHold.current) {
      // Complete the first unfinished set; if all done, do nothing
      setSetResults((prev) => {
        const idx = prev.findIndex((r) => r < plannedReps);
        if (idx === -1) return prev; // all sets complete — no change, no save
        const next = [...prev];
        next[idx] = plannedReps;
        return next;
      });
    }
  }

  function handlePointerLeave() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setIsHolding(false);
  }

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
    } catch { setError('Network error'); }
    finally { setIsRescheduling(false); }
  }

  const alreadyLogged = !!log;
  const label = exerciseType === 'PULLUPS' ? 'Pullups' : 'Dips';

  return (
    <div
      className={`${styles.widgetCard} ${styles.widgetExercise} ${styles.widgetStrength}`}
      style={{ background: baseBg, position: 'relative', cursor: 'pointer' }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      {isHolding && <div className={styles.wHoldRipple} />}

      <div className={styles.wExerciseHeader}>
        <div className={styles.wExerciseTitleGroup}>
          <span className={styles.wExerciseLabel}>{label}</span>
          <span className={styles.wExerciseWeight}>+{plannedWeight} kg</span>
        </div>

        <div className={styles.wExerciseActions}>
          {!alreadyLogged && (
            <>
              <button
                className={styles.wRescheduleBtn}
                title="Move to yesterday"
                disabled={isRescheduling}
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

      {/* Set boxes */}
      <div className={styles.wSetRow}>
        {setResults.map((reps, i) => (
          <div key={i} className={styles.wSetBox} style={{ background: setBoxBg(reps, plannedReps) }}>
            <button
              className={styles.wSetBoxBtn}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={() => adjustSet(i, 1)}
              aria-label={`Set ${i + 1} add rep`}
            >+</button>

            <div className={styles.wSetBoxCenter}>
              {reps}/{plannedReps}
            </div>

            <button
              className={styles.wSetBoxBtn}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={() => adjustSet(i, -1)}
              aria-label={`Set ${i + 1} remove rep`}
            >−</button>
          </div>
        ))}
      </div>

      <div className={styles.wSubLabel} style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.63rem', marginTop: 6 }}>
        tap +1 rep to next set · hold 2 s to reset
      </div>

      {error && <div style={{ color: 'rgba(255,120,120,0.9)', fontSize: '0.75rem', marginTop: 8 }}>{error}</div>}

      {progression && (
        <div
          className={styles.progressionBanner}
          style={{ marginTop: 10 }}
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
