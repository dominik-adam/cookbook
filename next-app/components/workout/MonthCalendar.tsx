import styles from '@/styles/planner.module.css';
import type { MonthData } from '@/types/planner';

interface MonthCalendarProps {
  year: number;
  month: number; // 0-indexed
  monthData: MonthData | null;
  selectedDate: string;
  isLoading: boolean;
  onDayClick: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function padLeft(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${padLeft(d.getMonth() + 1)}-${padLeft(d.getDate())}`;
}

export default function MonthCalendar({
  year,
  month,
  monthData,
  selectedDate,
  isLoading,
  onDayClick,
  onMonthChange,
}: MonthCalendarProps) {
  const today = todayStr();

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rawFirstDay = firstDay.getDay();
  const leadingBlanks = (rawFirstDay + 6) % 7; // Mon-first

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function handlePrev() {
    if (month === 0) onMonthChange(year - 1, 11);
    else onMonthChange(year, month - 1);
  }

  function handleNext() {
    if (month === 11) onMonthChange(year + 1, 0);
    else onMonthChange(year, month + 1);
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <button className={styles.calNavBtn} onClick={handlePrev} aria-label="Previous month">‹</button>
        <span className={styles.calMonthTitle}>{MONTH_NAMES[month]} {year}</span>
        <button className={styles.calNavBtn} onClick={handleNext} aria-label="Next month">›</button>
      </div>

      {isLoading ? (
        <div className={styles.loadingSpinner}>Loading…</div>
      ) : (
        <div className={styles.calGrid}>
          {DAY_HEADERS.map((d) => (
            <div key={d} className={styles.calDayHeader}>{d}</div>
          ))}

          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`blank-${i}`} className={`${styles.calDayCell} ${styles.calDayCellEmpty}`} />;
            }

            const dateStr = `${year}-${padLeft(month + 1)}-${padLeft(day)}`;
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const summary = monthData?.days[dateStr];

            let cellClass = styles.calDayCell;
            if (isToday) cellClass += ` ${styles.calDayCellToday}`;
            if (isSelected) cellClass += ` ${styles.calDayCellSelected}`;

            return (
              <div key={dateStr} className={cellClass} onClick={() => onDayClick(dateStr)} title={dateStr}>
                <span className={styles.calDayNum}>{day}</span>

                {summary && (
                  <div className={styles.calDotRow}>
                    {/* Water dot */}
                    <span
                      className={`${styles.calDot} ${summary.waterDone ? styles.calDotGreen : styles.calDotGray}`}
                      title="Water"
                    />
                    {/* Creatine dot */}
                    <span
                      className={`${styles.calDot} ${summary.creatineDone ? styles.calDotGreen : styles.calDotGray}`}
                      title="Creatine"
                    />
                    {/* Calories dot */}
                    <span
                      className={`${styles.calDot} ${summary.caloriesDone ? styles.calDotGreen : styles.calDotGray}`}
                      title="Calories"
                    />
                    {/* Exercise dots */}
                    {summary.exercises.map((ex, j) => (
                      <span
                        key={j}
                        className={`${styles.calDot} ${
                          ex.completed
                            ? styles.calDotGreen
                            : ex.past
                            ? styles.calDotOrange
                            : styles.calDotGray
                        }`}
                        title={ex.type}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
