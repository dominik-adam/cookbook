import { useState } from 'react';
import styles from '@/styles/planner.module.css';
import type { CalendarExercise, ExerciseType, MonthData } from '@/types/planner';

interface MonthCalendarProps {
  year: number;
  month: number; // 0-indexed
  monthData: MonthData | null;
  selectedDate: string;
  isLoading: boolean;
  onDayClick: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
  onUpdated: () => void;
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad(n: number): string { return n < 10 ? `0${n}` : `${n}`; }

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function exerciseLabel(type: ExerciseType): string {
  if (type === 'SPRINTS') return 'Sprints';
  if (type === 'PULLUPS') return 'Pullups';
  return 'Dips';
}

function cardBg(ex: CalendarExercise): string {
  if (ex.logged && ex.fullyCompleted)  return 'linear-gradient(150deg, #0a4a2d 0%, #1a7a4a 100%)';
  if (ex.logged && !ex.fullyCompleted) return 'linear-gradient(150deg, #0a3520 0%, #0d5030 100%)';
  if (ex.past)                         return 'linear-gradient(150deg, #3a1800 0%, #5e3200 100%)';
  if (ex.type === 'SPRINTS')           return 'linear-gradient(150deg, #0d2a6e 0%, #1048b0 100%)';
  if (ex.type === 'PULLUPS')           return 'linear-gradient(150deg, #1a0a3e 0%, #2d1a6e 100%)';
  return                                       'linear-gradient(150deg, #0a2a1a 0%, #1a4a2a 100%)';
}

export default function MonthCalendar({
  year, month, monthData, selectedDate, isLoading,
  onDayClick, onMonthChange, onUpdated,
}: MonthCalendarProps) {
  const today = todayStr();
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);

  const firstDow      = new Date(year, month, 1).getDay();
  const daysInMonth   = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (firstDow + 6) % 7; // Monday-first

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  async function handleReschedule(scheduleId: string, direction: 'prev' | 'next') {
    setReschedulingId(scheduleId);
    try {
      const res = await fetch('/api/planner/exercise/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId, direction }),
      });
      if (res.ok) onUpdated();
    } catch { /* ignore */ }
    finally { setReschedulingId(null); }
  }

  function handlePrev() {
    if (month === 0) onMonthChange(year - 1, 11);
    else onMonthChange(year, month - 1);
  }
  function handleNext() {
    if (month === 11) onMonthChange(year + 1, 0);
    else onMonthChange(year, month + 1);
  }

  return (
    <div className={styles.calendarWrap}>
      <div className={styles.calendarHeader}>
        <button className={styles.calNavBtn} onClick={handlePrev} aria-label="Previous month">‹</button>
        <span className={styles.calMonthTitle}>{MONTH_NAMES[month]} {year}</span>
        <button className={styles.calNavBtn} onClick={handleNext} aria-label="Next month">›</button>
      </div>

      {isLoading ? (
        <div className={styles.loadingSpinner}>Loading…</div>
      ) : (
        <div className={styles.calendarBody}>
          <div className={styles.calDayHeaderRow}>
            {DAY_HEADERS.map((d) => (
              <div key={d} className={styles.calDayHeader}>{d}</div>
            ))}
          </div>

          <div className={styles.calDayGrid}>
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`blank-${i}`} className={`${styles.calDayCell} ${styles.calDayCellEmpty}`} />;
              }

              const dateStr    = `${year}-${pad(month + 1)}-${pad(day)}`;
              const isToday    = dateStr === today;
              const isSelected = dateStr === selectedDate;
              const exercises  = monthData?.days[dateStr]?.exercises ?? [];

              let cellCls = styles.calDayCell;
              if (isToday)    cellCls += ` ${styles.calDayCellToday}`;
              if (isSelected) cellCls += ` ${styles.calDayCellSelected}`;

              return (
                <div key={dateStr} className={cellCls} onClick={() => onDayClick(dateStr)}>
                  <span className={styles.calDayNum}>{day}</span>

                  {exercises.map((ex) => {
                    const isBusy = reschedulingId === ex.scheduleId;

                    return (
                      <div
                        key={ex.scheduleId}
                        className={styles.calExCard}
                        style={{ background: cardBg(ex) }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Title row + reschedule buttons */}
                        <div className={styles.calExCardHead}>
                          <span className={styles.calExCardTitle}>
                            {exerciseLabel(ex.type)}
                          </span>
                          {!ex.logged && (
                            <div className={styles.calExCardBtns}>
                              <button
                                className={styles.calExCardBtn}
                                disabled={isBusy}
                                onClick={() => handleReschedule(ex.scheduleId, 'prev')}
                                title="Move to previous day"
                              >←</button>
                              <button
                                className={styles.calExCardBtn}
                                disabled={isBusy}
                                onClick={() => handleReschedule(ex.scheduleId, 'next')}
                                title="Move to next day"
                              >→</button>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        {ex.type === 'SPRINTS' ? (
                          /* Sprints: done → "X / Y", planned → "X" */
                          <div className={styles.calExCardBigNum}>
                            {ex.logged
                              ? `${ex.sprintsDone ?? '?'} / ${ex.sprintsPlanned ?? '?'}`
                              : `${ex.sprintsPlanned ?? '?'}`}
                          </div>
                        ) : ex.logged ? (
                          /* Strength done: one box per set showing done / planned */
                          <div className={styles.calExSetRow}>
                            {(ex.setResults ?? []).map((reps, idx) => (
                              <div key={idx} className={styles.calExSetBox}>
                                {reps}
                                <span className={styles.calExSetSep}>/</span>
                                {ex.repsPerSetPlanned ?? '?'}
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* Strength planned: sets×reps + weight */
                          <>
                            <div className={styles.calExCardBigNum}>
                              {ex.setsPlanned ?? '?'}×{ex.repsPerSetPlanned ?? '?'}
                            </div>
                            {ex.weightKgPlanned !== null && (
                              <div className={styles.calExCardSub}>
                                +{ex.weightKgPlanned} kg
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
