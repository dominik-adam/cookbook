import { useState } from 'react';
import styles from '@/styles/planner.module.css';
import type { DailyLog, DailyPlanSettings } from '@/types/planner';

interface WaterWidgetProps {
  dailyLog: DailyLog | null;
  settings: DailyPlanSettings | null;
  date: string;
  onUpdated: () => void;
}

function progressColor(pct: number): string {
  if (pct <= 0) return '#e8e8e8';
  if (pct < 0.5) return '#f5c842';
  if (pct < 0.75) return '#f5a623';
  if (pct < 1) return '#7ec8a0';
  return '#3aa46c';
}

export default function WaterWidget({ dailyLog, settings, date, onUpdated }: WaterWidgetProps) {
  const target = dailyLog?.waterTargetL ?? settings?.waterTargetL ?? 3;
  const [consumed, setConsumed] = useState(dailyLog?.waterConsumedL ?? 0);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const pct = Math.min(consumed / target, 1);
  const isComplete = consumed >= target;

  async function updateWater(newAmount: number) {
    setIsLoading(true);
    setError('');
    const clamped = Math.max(0, Math.round(newAmount * 100) / 100);
    setConsumed(clamped); // optimistic
    try {
      const res = await fetch('/api/planner/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, amount: clamped }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to save');
        setConsumed(dailyLog?.waterConsumedL ?? 0);
      } else {
        onUpdated();
      }
    } catch {
      setError('Network error');
      setConsumed(dailyLog?.waterConsumedL ?? 0);
    } finally {
      setIsLoading(false);
    }
  }

  function handleQuickAdd(delta: number) {
    updateWater(consumed + delta);
  }

  function handleManualAdd() {
    const val = parseFloat(inputVal);
    if (isNaN(val) || val <= 0) return;
    setInputVal('');
    updateWater(consumed + val);
  }

  return (
    <div className={`${styles.widgetCard} ${isComplete ? styles.widgetCardComplete : ''}`}>
      <div className={styles.widgetHeader}>
        <span className={styles.widgetTitle}>
          Water
          <span className={styles.widgetSubtitle}>intake</span>
        </span>
        <span className={styles.widgetValue}>
          {consumed.toFixed(1)} / {target.toFixed(1)} L
        </span>
      </div>

      <div className={styles.progressBarOuter}>
        <div
          className={styles.progressBarInner}
          style={{ width: `${pct * 100}%`, backgroundColor: progressColor(pct) }}
        />
      </div>

      <div className={styles.waterQuickAdd}>
        <button className={styles.quickAddBtn} onClick={() => handleQuickAdd(0.25)} disabled={isLoading}>+0.25L</button>
        <button className={styles.quickAddBtn} onClick={() => handleQuickAdd(0.5)} disabled={isLoading}>+0.5L</button>
        <button className={styles.quickAddBtn} onClick={() => handleQuickAdd(1)} disabled={isLoading}>+1L</button>
        {consumed > 0 && (
          <button className={styles.quickAddBtn} onClick={() => updateWater(Math.max(0, consumed - 0.5))} disabled={isLoading}>
            −0.5L
          </button>
        )}
      </div>

      <div className={styles.waterInputRow}>
        <input
          className={styles.waterInput}
          type="number"
          step="0.1"
          min="0"
          placeholder="Custom L — press Enter"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()}
          onBlur={handleManualAdd}
        />
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}
    </div>
  );
}
