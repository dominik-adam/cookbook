import styles from '@/styles/planner.module.css';
import WaterWidget from './WaterWidget';
import CreatineWidget from './CreatineWidget';
import CalorieWidget from './CalorieWidget';
import WeightWidget from './WeightWidget';
import SprintsWidget from './SprintsWidget';
import StrengthWidget from './StrengthWidget';
import type { DayData, DailyPlanSettings } from '@/types/planner';

interface DayViewProps {
  date: string;
  today: string;
  dayData: DayData | null;
  isLoading: boolean;
  settings: DailyPlanSettings | null;
  onDateChange: (date: string) => void;
  onDayUpdated: () => void;
  onOpenSettings: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Use UTC to avoid local-timezone day-of-week shift
  const d = new Date(Date.UTC(year, month - 1, day));
  return `${DAY_NAMES[d.getUTCDay()]} ${day} ${MONTH_NAMES[month - 1]}`;
}

function shiftDate(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default function DayView({
  date,
  today,
  dayData,
  isLoading,
  settings,
  onDateChange,
  onDayUpdated,
  onOpenSettings,
}: DayViewProps) {
  const isToday = date === today;

  const dailyLog = dayData?.dailyLog ?? null;
  const exerciseSchedules = dayData?.exerciseSchedules ?? [];
  const effectiveSettings = dayData?.settings ?? settings;

  return (
    <div>
      {/* Date navigation */}
      <div className={styles.dayNav}>
        <button
          className={styles.dayNavArrow}
          onClick={() => onDateChange(shiftDate(date, -1))}
          aria-label="Previous day"
        >
          ‹
        </button>
        <span className={styles.dayNavDate}>{formatDate(date)}</span>
        <button
          className={styles.dayNavArrow}
          onClick={() => onDateChange(shiftDate(date, 1))}
          aria-label="Next day"
        >
          ›
        </button>
        {!isToday && (
          <button className={styles.dayNavToday} onClick={() => onDateChange(today)}>
            Today
          </button>
        )}
      </div>

      {isLoading ? (
        <div className={styles.loadingSpinner}>Loading…</div>
      ) : (
        <div className={styles.widgetGrid}>
          {/* Daily habits — always shown */}
          {effectiveSettings ? (
            <>
              <WaterWidget
                dailyLog={dailyLog}
                settings={effectiveSettings}
                date={date}
                onUpdated={onDayUpdated}
              />
              <CreatineWidget
                dailyLog={dailyLog}
                settings={effectiveSettings}
                date={date}
                onUpdated={onDayUpdated}
              />
              <CalorieWidget
                dailyLog={dailyLog}
                settings={effectiveSettings}
                date={date}
                onUpdated={onDayUpdated}
              />
              <WeightWidget
                dailyLog={dailyLog}
                date={date}
                onUpdated={onDayUpdated}
              />
            </>
          ) : (
            <div className={styles.loadingSpinner}>Initializing your plan…</div>
          )}

          {/* Exercise widgets — only for scheduled days */}
          {exerciseSchedules.length > 0 && (
            <>
              <div className={styles.wSectionLabel}>Exercises today</div>
              {exerciseSchedules.map((sched) =>
                sched.exerciseType === 'SPRINTS' ? (
                  <SprintsWidget
                    key={sched.id}
                    schedule={sched}
                    settings={effectiveSettings}
                    onUpdated={onDayUpdated}
                  />
                ) : (
                  <StrengthWidget
                    key={sched.id}
                    schedule={sched}
                    exerciseType={sched.exerciseType as 'PULLUPS' | 'DIPS'}
                    settings={effectiveSettings}
                    onUpdated={onDayUpdated}
                  />
                )
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
