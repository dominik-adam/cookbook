import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/planner.module.css';
import type { DailyLog } from '@/types/planner';
import { HOLD_TO_RESET_MS } from '@/lib/uiConfig';

interface WeightWidgetProps {
  dailyLog: DailyLog | null;
  date: string;
  onUpdated: () => void;
}

const BG_EMPTY  = 'linear-gradient(145deg, #1a1c2e 0%, #0d0f1e 100%)';
const BG_LOGGED = 'linear-gradient(145deg, #0a3a2d 0%, #1a5a3a 100%)';

export default function WeightWidget({ dailyLog, date, onUpdated }: WeightWidgetProps) {
  const [inputVal, setInputVal] = useState(dailyLog?.weightKg?.toString() ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLogged = inputVal !== '' && parseFloat(inputVal) > 0;

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  // Hold-to-reset (2 s) — clears logged weight
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHold   = useRef(false);

  function handlePointerDown() {
    if (isEditing) return; // don't interfere while typing
    didHold.current = false;
    setIsHolding(true);
    holdTimer.current = setTimeout(async () => {
      didHold.current = true;
      setIsHolding(false);
      setInputVal('');
      await fetch('/api/planner/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, weightKg: null }),
      });
      onUpdated();
    }, HOLD_TO_RESET_MS);
  }

  function handlePointerUp() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setIsHolding(false);
    if (!isEditing && !didHold.current) setIsEditing(true);
  }

  function handlePointerLeave() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setIsHolding(false);
  }

  async function commitSave() {
    const val = parseFloat(inputVal);
    if (isNaN(val) || val <= 0) { setIsEditing(false); return; }
    setIsEditing(false);
    await fetch('/api/planner/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, weightKg: val }),
    });
    onUpdated();
  }

  return (
    <div
      className={`${styles.widgetCard} ${styles.widgetHabit}`}
      style={{ background: isLogged ? BG_LOGGED : BG_EMPTY, cursor: isEditing ? 'default' : 'pointer', position: 'relative' }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      {isHolding && <div className={styles.wHoldRipple} />}

      <div className={styles.wLabel}>Weight</div>

      <div className={styles.wBigNum}>
        {isEditing ? (
          <input
            ref={inputRef}
            className={styles.wSeamlessInput}
            type="number"
            step="0.1"
            min="0"
            placeholder="--"
            value={inputVal}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={commitSave}
            onKeyDown={(e) => e.key === 'Enter' && commitSave()}
          />
        ) : (
          <>{isLogged ? inputVal : '--'} {isLogged && <span className={styles.wUnit}>kg</span>}</>
        )}
      </div>

      <div className={styles.wSubLabel}>
        {isEditing
          ? 'enter · blur to save'
          : isLogged
          ? 'tap to edit · hold to clear'
          : 'tap to log · hold to clear'}
      </div>
    </div>
  );
}
