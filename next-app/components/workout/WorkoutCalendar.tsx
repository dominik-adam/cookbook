import styles from '@/styles/workout.module.css';

interface WorkoutCalendarProps {
  year: number;
  month: number; // 0-indexed
  sessionDates: string[];
  selectedDate: string | null;
  onDayClick: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
  isLoading?: boolean;
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function padLeft(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export default function WorkoutCalendar({
  year,
  month,
  sessionDates,
  selectedDate,
  onDayClick,
  onMonthChange,
  isLoading,
}: WorkoutCalendarProps) {
  const sessionDateSet = new Set(sessionDates);

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // getDay(): 0=Sun, 1=Mon … 6=Sat → convert to Mon=0 index
  const rawFirstDay = firstDay.getDay();
  const leadingBlanks = (rawFirstDay + 6) % 7;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${padLeft(today.getMonth() + 1)}-${padLeft(today.getDate())}`;

  const handlePrev = () => {
    if (month === 0) {
      onMonthChange(year - 1, 11);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const handleNext = () => {
    if (month === 11) {
      onMonthChange(year + 1, 0);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <button className={styles.navButton} onClick={handlePrev} aria-label="Previous month">
          ‹
        </button>
        <span className={styles.monthTitle}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button className={styles.navButton} onClick={handleNext} aria-label="Next month">
          ›
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loadingSpinner}>Loading…</div>
      ) : (
        <div className={styles.calendarGrid}>
          {DAY_HEADERS.map((d) => (
            <div key={d} className={styles.dayHeader}>{d}</div>
          ))}

          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`blank-${i}`} className={`${styles.dayCell} ${styles.dayCellEmpty}`} />;
            }

            const dateStr = `${year}-${padLeft(month + 1)}-${padLeft(day)}`;
            const hasWorkout = sessionDateSet.has(dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;

            let cellClass = styles.dayCell;
            if (isToday) cellClass += ` ${styles.dayCellToday}`;
            if (isSelected) cellClass += ` ${styles.dayCellSelected}`;

            return (
              <div
                key={dateStr}
                className={cellClass}
                onClick={() => onDayClick(dateStr)}
                title={dateStr}
              >
                <span className={styles.dayNumber}>{day}</span>
                {hasWorkout && <span className={styles.workoutDot} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
