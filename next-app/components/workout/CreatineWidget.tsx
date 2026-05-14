import { useState } from 'react';
import styles from '@/styles/planner.module.css';
import type { DailyLog, DailyPlanSettings } from '@/types/planner';

interface CreatineWidgetProps {
  dailyLog: DailyLog | null;
  settings: DailyPlanSettings | null;
  date: string;
  onUpdated: () => void;
}

export default function CreatineWidget({ dailyLog, settings, date, onUpdated }: CreatineWidgetProps) {
  const dose = dailyLog?.creatineTargetG ?? settings?.creatineTargetG ?? 5;
  const [done, setDone] = useState(dailyLog?.creatineDone ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function toggle() {
    const newDone = !done;
    setDone(newDone); // optimistic
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/planner/creatine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, done: newDone }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to save');
        setDone(!newDone);
      } else {
        onUpdated();
      }
    } catch {
      setError('Network error');
      setDone(!newDone);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={`${styles.widgetCard} ${done ? styles.widgetCardComplete : ''}`}>
      <div className={styles.widgetHeader}>
        <span className={styles.widgetTitle}>
          Creatine
          <span className={styles.widgetSubtitle}>{dose}g daily</span>
        </span>
        {done && <span className={styles.widgetValue}>✓ done</span>}
      </div>

      <button
        className={`${styles.creatineToggle} ${done ? styles.creatineToggleDone : styles.creatineToggleUndone}`}
        onClick={toggle}
        disabled={isLoading}
      >
        {done ? '✓ Taken today' : 'Mark as taken'}
      </button>

      {error && <div className={styles.errorMsg}>{error}</div>}
    </div>
  );
}
