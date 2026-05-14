import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/planner.module.css';
import type { DailyLog } from '@/types/planner';

interface WeightWidgetProps {
  dailyLog: DailyLog | null;
  date: string;
  onUpdated: () => void;
}

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export default function WeightWidget({ dailyLog, date, onUpdated }: WeightWidgetProps) {
  const [inputVal, setInputVal] = useState(dailyLog?.weightKg?.toString() ?? '');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState('');

  const isLogged = dailyLog?.weightKg != null;
  const isComplete = isLogged || (parseFloat(inputVal) > 0);

  const latestRef = useRef({ inputVal, date });
  latestRef.current = { inputVal, date };

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }

    const val = parseFloat(inputVal);
    if (isNaN(val) || val <= 0) return; // don't save incomplete/invalid input

    setSaveStatus('pending');
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      const { inputVal, date } = latestRef.current;
      const val = parseFloat(inputVal);
      if (isNaN(val) || val <= 0) return;

      setSaveStatus('saving');
      try {
        const res = await fetch('/api/planner/weight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, weightKg: val }),
        });
        if (!res.ok) {
          const data = await res.json();
          setSaveStatus('error');
          setError(data.error ?? 'Failed to save');
        } else {
          setSaveStatus('saved');
          setError('');
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
  }, [inputVal]);

  return (
    <div className={`${styles.widgetCard} ${isComplete ? styles.widgetCardComplete : ''}`}>
      <div className={styles.widgetHeader}>
        <span className={styles.widgetTitle}>Weight</span>
        <span className={styles.autoSaveStatus} data-status={saveStatus}>
          {saveStatus === 'pending' && 'Unsaved…'}
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && '✓ Saved'}
          {saveStatus === 'error' && 'Save failed'}
        </span>
      </div>

      <div className={styles.weightInputRow}>
        <input
          className={styles.weightInput}
          type="number"
          step="0.1"
          min="0"
          placeholder="kg"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
        />
        <span style={{ fontSize: '0.85rem', color: '#666' }}>kg</span>
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}
    </div>
  );
}
