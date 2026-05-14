import { useRef, useState } from 'react';
import styles from '@/styles/planner.module.css';
import type { CalorieEntry, DailyLog, DailyPlanSettings } from '@/types/planner';
import { HOLD_TO_RESET_MS } from '@/lib/uiConfig';

interface CalorieWidgetProps {
  dailyLog: DailyLog | null;
  settings: DailyPlanSettings | null;
  date: string;
  onUpdated: () => void;
}

const BG_DEFAULT  = 'linear-gradient(145deg, #2d1a4e 0%, #1a0d3a 100%)';
const BG_COMPLETE = 'linear-gradient(145deg, #0a4a2d 0%, #1a7a4a 100%)';

export default function CalorieWidget({ dailyLog, settings, date, onUpdated }: CalorieWidgetProps) {
  const target         = dailyLog?.calorieTarget ?? settings?.calorieTarget ?? 2500;
  const entries: CalorieEntry[] = dailyLog?.calorieEntries ?? [];
  const totalConsumed  = entries.reduce((s, e) => s + e.amount, 0);
  const pct            = Math.min(totalConsumed / target, 1);
  const isComplete     = totalConsumed >= target;

  const [isOpen, setIsOpen]       = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newLabel,  setNewLabel]  = useState('');
  const [isAdding,  setIsAdding]  = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [error, setError]         = useState('');
  const [isHolding, setIsHolding] = useState(false);

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
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed to add'); }
      else { setNewAmount(''); setNewLabel(''); onUpdated(); }
    } catch { setError('Network error'); }
    finally { setIsAdding(false); }
  }

  async function handleDelete(entryId: string) {
    setIsDeletingId(entryId);
    try {
      const res = await fetch('/api/planner/calories/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed to delete'); }
      else onUpdated();
    } catch { setError('Network error'); }
    finally { setIsDeletingId(null); }
  }

  async function handleClearAll() {
    if (entries.length === 0) return;
    try {
      await Promise.all(
        entries.map((e) =>
          fetch('/api/planner/calories/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entryId: e.id }),
          })
        )
      );
      onUpdated();
    } catch { /* ignore */ }
  }

  // Hold-to-reset (2 s) — clears all calorie entries
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHold   = useRef(false);

  function handlePointerDown() {
    didHold.current = false;
    setIsHolding(true);
    holdTimer.current = setTimeout(() => {
      didHold.current = true;
      setIsHolding(false);
      handleClearAll();
    }, HOLD_TO_RESET_MS);
  }

  function handlePointerUp() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setIsHolding(false);
    if (!didHold.current) setIsOpen(true);
  }

  function handlePointerLeave() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setIsHolding(false);
  }

  return (
    <>
      {/* Widget tile */}
      <div
        className={`${styles.widgetCard} ${styles.widgetHabit}`}
        style={{ background: isComplete ? BG_COMPLETE : BG_DEFAULT, position: 'relative' }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        {isHolding && <div className={styles.wHoldRipple} />}

        <div className={styles.wLabel}>Calories</div>

        <div>
          <div className={styles.wBigNum}>
            {totalConsumed} <span className={styles.wUnit}>kcal</span>
          </div>
          <div className={styles.wProgressBar}>
            <div className={styles.wProgressFill} style={{ width: `${pct * 100}%` }} />
          </div>
          <div className={styles.wSubLabel}>/ {target} target · tap to log · hold to clear</div>
        </div>
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
                    >✕</button>
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
              <button className={styles.calorieAddBtn} onClick={handleAdd} disabled={isAdding || !newAmount}>
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
