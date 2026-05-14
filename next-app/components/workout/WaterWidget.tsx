import { useRef, useState } from 'react';
import styles from '@/styles/planner.module.css';
import type { DailyLog, DailyPlanSettings } from '@/types/planner';
import { HOLD_TO_RESET_MS } from '@/lib/uiConfig';

interface WaterWidgetProps {
  dailyLog: DailyLog | null;
  settings: DailyPlanSettings | null;
  date: string;
  onUpdated: () => void;
}

const BG_DEFAULT  = 'linear-gradient(145deg, #0d2a6e 0%, #1048b0 100%)';
const BG_COMPLETE = 'linear-gradient(145deg, #0a4a2d 0%, #1a7a4a 100%)';

export default function WaterWidget({ dailyLog, settings, date, onUpdated }: WaterWidgetProps) {
  const target   = dailyLog?.waterTargetL ?? settings?.waterTargetL ?? 3;
  const [consumed, setConsumed] = useState(dailyLog?.waterConsumedL ?? 0);
  const [isHolding, setIsHolding] = useState(false);

  const pct        = Math.min(consumed / target, 1);
  const isComplete = consumed >= target;

  // Debounce API saves so rapid clicks coalesce into one request
  const pendingRef = useRef(consumed);
  const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSave(newAmount: number) {
    pendingRef.current = newAmount;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const amt = Math.max(0, Math.round(pendingRef.current * 1000) / 1000);
      await fetch('/api/planner/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, amount: amt }),
      });
      onUpdated();
    }, 400);
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
      setConsumed(0);
      scheduleSave(0);
    }, HOLD_TO_RESET_MS);
  }

  function handlePointerUp() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setIsHolding(false);
    if (!didHold.current) {
      const next = Math.round((consumed + 0.5) * 1000) / 1000;
      setConsumed(next);
      scheduleSave(next);
    }
  }

  function handlePointerLeave() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setIsHolding(false);
  }

  const displayMl = Math.round(consumed * 1000);
  const targetMl  = Math.round(target  * 1000);

  return (
    <div
      className={`${styles.widgetCard} ${styles.widgetHabit}`}
      style={{ background: isComplete ? BG_COMPLETE : BG_DEFAULT }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      {isHolding && <div className={styles.wHoldRipple} />}

      <div className={styles.wLabel}>Water</div>

      <div>
        <div className={styles.wBigNum}>
          {displayMl} <span className={styles.wUnit}>ml</span>
        </div>
        <div className={styles.wProgressBar}>
          <div className={styles.wProgressFill} style={{ width: `${pct * 100}%` }} />
        </div>
        <div className={styles.wSubLabel}>/ {targetMl} ml · tap +500 ml · hold to reset</div>
      </div>
    </div>
  );
}
