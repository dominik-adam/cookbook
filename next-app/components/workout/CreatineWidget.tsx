import { useRef, useState } from 'react';
import styles from '@/styles/planner.module.css';
import type { DailyLog, DailyPlanSettings } from '@/types/planner';
import { HOLD_TO_RESET_MS } from '@/lib/uiConfig';

interface CreatineWidgetProps {
  dailyLog: DailyLog | null;
  settings: DailyPlanSettings | null;
  date: string;
  onUpdated: () => void;
}

const BG_UNDONE = 'linear-gradient(145deg, #1c1c2e 0%, #16213e 100%)';
const BG_DONE   = 'linear-gradient(145deg, #0a4a5e 0%, #0d6a8e 100%)';

export default function CreatineWidget({ dailyLog, settings, date, onUpdated }: CreatineWidgetProps) {
  const dose = dailyLog?.creatineTargetG ?? settings?.creatineTargetG ?? 5;
  const [done, setDone] = useState(dailyLog?.creatineDone ?? false);
  const [isHolding, setIsHolding] = useState(false);

  async function saveDone(newDone: boolean, prevDone: boolean) {
    try {
      const res = await fetch('/api/planner/creatine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, done: newDone }),
      });
      if (!res.ok) setDone(prevDone); // revert on error
      else onUpdated();
    } catch {
      setDone(prevDone);
    }
  }

  // Hold-to-reset (2 s)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHold   = useRef(false);

  function handlePointerDown() {
    didHold.current = false;
    setIsHolding(true);
    holdTimer.current = setTimeout(() => {
      didHold.current = true;
      setIsHolding(false);
      setDone(false);
      saveDone(false, true);
    }, HOLD_TO_RESET_MS);
  }

  function handlePointerUp() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setIsHolding(false);
    if (!didHold.current) {
      const newDone = !done;
      setDone(newDone);
      saveDone(newDone, done);
    }
  }

  function handlePointerLeave() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setIsHolding(false);
  }

  return (
    <div
      className={`${styles.widgetCard} ${styles.widgetHabit}`}
      style={{ background: done ? BG_DONE : BG_UNDONE, position: 'relative' }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      {isHolding && <div className={styles.wHoldRipple} />}
      <div className={styles.wLabel}>Creatine</div>
      <div className={styles.wBigNum}>
        {dose} <span className={styles.wUnit}>g</span>
      </div>
      <div className={styles.wSubLabel}>
        {done ? 'taken · hold to undo' : 'tap to mark taken'}
      </div>
    </div>
  );
}
