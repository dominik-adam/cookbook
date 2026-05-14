import { useState } from 'react';
import styles from '@/styles/planner.module.css';
import type { CalorieEntry, DailyLog, DailyPlanSettings } from '@/types/planner';

interface CalorieWidgetProps {
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

export default function CalorieWidget({ dailyLog, settings, date, onUpdated }: CalorieWidgetProps) {
  const target = dailyLog?.calorieTarget ?? settings?.calorieTarget ?? 2500;
  const entries: CalorieEntry[] = dailyLog?.calorieEntries ?? [];
  const totalConsumed = entries.reduce((s, e) => s + e.amount, 0);
  const pct = Math.min(totalConsumed / target, 1);
  const isComplete = totalConsumed >= target;

  const [isOpen, setIsOpen] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleAdd() {
    const amt = parseInt(newAmount, 10);
    if (isNaN(amt) || amt <= 0) return;
    setIsAdding(true);
    setError('');
    try {
      const res = await fetch('/api/planner/calories/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, amount: amt, label: newLabel || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to add');
      } else {
        setNewAmount('');
        setNewLabel('');
        onUpdated();
      }
    } catch {
      setError('Network error');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDelete(entryId: string) {
    setIsDeletingId(entryId);
    try {
      const res = await fetch('/api/planner/calories/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to delete');
      } else {
        onUpdated();
      }
    } catch {
      setError('Network error');
    } finally {
      setIsDeletingId(null);
    }
  }

  return (
    <>
      <div className={`${styles.widgetCard} ${isComplete ? styles.widgetCardComplete : ''}`}>
        <div className={styles.widgetHeader}>
          <span className={styles.widgetTitle}>
            Calories
            <span className={styles.widgetSubtitle}>intake</span>
          </span>
          <span className={styles.widgetValue}>
            {totalConsumed} / {target} kcal
          </span>
        </div>

        <div className={styles.progressBarOuter}>
          <div
            className={styles.progressBarInner}
            style={{ width: `${pct * 100}%`, backgroundColor: progressColor(pct) }}
          />
        </div>

        <button className={styles.calorieOpenBtn} onClick={() => setIsOpen(true)}>
          {entries.length > 0 ? `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} — add more` : '+ Log calories'}
        </button>
      </div>

      {/* Calorie modal */}
      <div className={`${styles.modalOverlay} ${isOpen ? styles.modalOverlayOpen : ''}`}>
        <div className={`${styles.modalBox} ${styles.calorieModal}`}>
          <div className={styles.modalHead}>
            <span className={styles.modalHeadTitle}>Calorie log — {date}</span>
            <button className={styles.modalCloseBtn} onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className={styles.modalBody}>
            <div style={{ marginBottom: 6, fontSize: '0.9rem', color: '#555' }}>
              Total: <strong>{totalConsumed} kcal</strong> / {target} kcal target
            </div>

            <div className={styles.calorieEntryList}>
              {entries.length === 0 ? (
                <div className={styles.emptyEntries}>No entries yet.</div>
              ) : (
                entries.map((e) => (
                  <div key={e.id} className={styles.calorieEntryRow}>
                    <span className={styles.calorieEntryLabel}>{e.label || '(no label)'}</span>
                    <span className={styles.calorieEntryAmt}>{e.amount} kcal</span>
                    <button
                      className={styles.calorieEntryDelete}
                      onClick={() => handleDelete(e.id)}
                      disabled={isDeletingId === e.id}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className={styles.calorieAddForm}>
              <input
                className={styles.calorieAmtInput}
                type="number"
                min="1"
                placeholder="kcal"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <input
                className={styles.calorieLabelInput}
                type="text"
                placeholder="Label (e.g. lunch)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <button
                className={styles.calorieAddBtn}
                onClick={handleAdd}
                disabled={isAdding || !newAmount}
              >
                Add
              </button>
            </div>

            {error && <div className={styles.errorMsg}>{error}</div>}
          </div>
        </div>
      </div>
    </>
  );
}
