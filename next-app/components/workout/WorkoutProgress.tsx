import styles from '@/styles/workout.module.css';
import type { WorkoutStats } from '@/types/workout';

interface WorkoutProgressProps {
  stats: WorkoutStats | null;
  isLoading: boolean;
}

function buildHeatmapDays(): Array<{ dateStr: string; label: string }> {
  const days: Array<{ dateStr: string; label: string }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 91 days = 13 weeks, fill so the first column starts on Monday
  const dayOfWeek = today.getDay(); // 0=Sun
  const daysFromMon = (dayOfWeek + 6) % 7;
  const totalDays = 84 + daysFromMon; // pad to start of a Mon

  for (let i = totalDays; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push({ dateStr: `${y}-${m}-${day}`, label: `${y}-${m}-${day}` });
  }

  return days;
}

type ColKey = 'date' | 'sets' | 'reps' | 'weight' | 'duration' | 'distance';
const COL_KEYS: ColKey[] = ['date', 'sets', 'reps', 'weight', 'duration', 'distance'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function WorkoutProgress({ stats, isLoading }: WorkoutProgressProps) {
  if (isLoading) {
    return <div className={styles.loadingSpinner}>Loading progress…</div>;
  }

  if (!stats) {
    return <div className={styles.noHistory}>No progress data available yet.</div>;
  }

  const heatmapDays = buildHeatmapDays();
  const activitySet = new Set(stats.activityDates);
  const todayStr = heatmapDays[heatmapDays.length - 1]?.dateStr ?? '';

  const exerciseNames = Object.keys(stats.exerciseHistory);

  return (
    <>
      {/* Stats cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.streak}</div>
          <div className={styles.statLabel}>day streak</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.thisWeekCount}</div>
          <div className={styles.statLabel}>this week</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.thisMonthCount}</div>
          <div className={styles.statLabel}>this month</div>
        </div>
      </div>

      {/* Activity heatmap */}
      <div className={styles.heatmapSection}>
        <div className={styles.heatmapTitle}>Activity — last 12 weeks</div>
        <div className={styles.heatmapScroll}>
          <div className={styles.heatmapGrid}>
            {heatmapDays.map(({ dateStr, label }) => {
              const isActive = activitySet.has(dateStr);
              const isToday = dateStr === todayStr;
              let cellClass = styles.heatmapCell;
              if (isActive) cellClass += ` ${styles.heatmapCellActive}`;
              if (isToday) cellClass += ` ${styles.heatmapCellToday}`;
              return (
                <div
                  key={dateStr}
                  className={cellClass}
                  title={isActive ? `${label}: workout logged` : label}
                />
              );
            })}
          </div>
        </div>
        <div className={styles.heatmapLegend}>
          <span>Less</span>
          <div className={styles.heatmapLegendCell} style={{ background: 'rgb(220,220,220)' }} />
          <div className={styles.heatmapLegendCell} style={{ background: '#7ec8a0' }} />
          <div className={styles.heatmapLegendCell} style={{ background: '#3aa46c' }} />
          <span>More</span>
        </div>
      </div>

      {/* Per-exercise history */}
      <div className={styles.exerciseHistorySection}>
        <div className={styles.exerciseHistoryTitle}>Exercise History</div>

        {exerciseNames.length === 0 ? (
          <div className={styles.noHistory}>
            Log some workouts to see your exercise history here.
          </div>
        ) : (
          exerciseNames.map((name) => {
            const entries = stats.exerciseHistory[name];

            const visibleCols = COL_KEYS.filter((key) => {
              if (key === 'date') return true;
              return entries.some((e) => e[key] != null);
            });

            const colLabels: Record<ColKey, string> = {
              date: 'Date',
              sets: 'Sets',
              reps: 'Reps',
              weight: 'Weight (kg)',
              duration: 'Duration (min)',
              distance: 'Distance (km)',
            };

            return (
              <div key={name} className={styles.exerciseBlock}>
                <div className={styles.exerciseBlockTitle}>{name}</div>
                <table className={styles.progressTable}>
                  <thead>
                    <tr>
                      {visibleCols.map((col) => (
                        <th key={col}>{colLabels[col]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, i) => (
                      <tr key={i}>
                        {visibleCols.map((col) => (
                          <td key={col}>
                            {col === 'date'
                              ? formatDate(entry.date)
                              : entry[col] != null
                              ? entry[col]
                              : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
