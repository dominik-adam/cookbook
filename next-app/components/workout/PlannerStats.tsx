import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import styles from '@/styles/planner.module.css';
import type { PlannerStats } from '@/types/planner';

interface PlannerStatsProps {
  stats: PlannerStats | null;
  isLoading: boolean;
  onRangeChange: (days: number) => void;
}

type Range = 30 | 90 | 0; // 0 = all time

function fmtDate(d: string): string {
  return d.slice(5); // MM-DD
}

export default function PlannerStatsComponent({ stats, isLoading, onRangeChange }: PlannerStatsProps) {
  const [range, setRange] = useState<Range>(90);

  function handleRange(days: Range) {
    setRange(days);
    onRangeChange(days);
  }

  if (isLoading) {
    return <div className={styles.loadingSpinner}>Loading stats…</div>;
  }

  if (!stats) {
    return <div className={styles.noData}>Log some habits to see your progress here.</div>;
  }

  const { summary, waterTrend, calorieTrend, weightHistory, sprintHistory, strengthHistory, exerciseCompletionRates } = stats;

  const completionBarData = [
    { name: 'Sprints', scheduled: exerciseCompletionRates.SPRINTS.scheduled, completed: exerciseCompletionRates.SPRINTS.completed },
    { name: 'Pullups', scheduled: exerciseCompletionRates.PULLUPS.scheduled, completed: exerciseCompletionRates.PULLUPS.completed },
    { name: 'Dips', scheduled: exerciseCompletionRates.DIPS.scheduled, completed: exerciseCompletionRates.DIPS.completed },
  ].filter((d) => d.scheduled > 0);

  return (
    <>
      {/* Range selector */}
      <div className={styles.statsRangeBar}>
        {([30, 90, 0] as Range[]).map((d) => (
          <button
            key={d}
            className={`${styles.statsRangeBtn} ${range === d ? styles.statsRangeBtnActive : ''}`}
            onClick={() => handleRange(d)}
          >
            {d === 0 ? 'All time' : `${d} days`}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{summary.totalDaysLogged}</div>
          <div className={styles.statLabel}>days logged</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{summary.daysWithWaterMet}</div>
          <div className={styles.statLabel}>water goal met</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{summary.daysWithCreatine}</div>
          <div className={styles.statLabel}>creatine taken</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{summary.daysWithCaloriesMet}</div>
          <div className={styles.statLabel}>calorie goal met</div>
        </div>
      </div>

      {/* Water trend */}
      {waterTrend.length > 0 && (
        <div className={styles.chartSection}>
          <div className={styles.chartTitle}>Water intake (L)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={waterTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(230,248,248)" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)} L`} />
              <Legend />
              <Line type="monotone" dataKey="consumed" stroke="#3aa46c" strokeWidth={2} dot={false} name="Consumed" />
              <Line type="monotone" dataKey="target" stroke="rgb(179,228,228)" strokeWidth={1} dot={false} strokeDasharray="4 2" name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Calorie trend */}
      {calorieTrend.length > 0 && (
        <div className={styles.chartSection}>
          <div className={styles.chartTitle}>Calorie intake (kcal)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={calorieTrend} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(230,248,248)" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${v} kcal`} />
              <Legend />
              <Line type="monotone" dataKey="consumed" stroke="#3aa46c" strokeWidth={2} dot={false} name="Consumed" />
              <Line type="monotone" dataKey="target" stroke="rgb(179,228,228)" strokeWidth={1} dot={false} strokeDasharray="4 2" name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weight history */}
      {weightHistory.length > 0 && (
        <div className={styles.chartSection}>
          <div className={styles.chartTitle}>Weight (kg)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightHistory} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(230,248,248)" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${v} kg`} />
              <Line type="monotone" dataKey="weightKg" stroke="#3aa46c" strokeWidth={2} dot={{ r: 3 }} name="Weight" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sprint history */}
      {sprintHistory.length > 0 && (
        <div className={styles.chartSection}>
          <div className={styles.chartTitle}>Sprints per session</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sprintHistory} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(230,248,248)" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="planned" fill="rgb(179,228,228)" name="Planned" />
              <Bar dataKey="done" fill="#3aa46c" name="Done" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pullup volume */}
      {strengthHistory.PULLUPS.length > 0 && (
        <div className={styles.chartSection}>
          <div className={styles.chartTitle}>Pullups — total reps per session</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={strengthHistory.PULLUPS} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(230,248,248)" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalReps" stroke="#3aa46c" strokeWidth={2} dot={{ r: 3 }} name="Total reps" />
              <Line type="monotone" dataKey="weightKg" stroke="#f5a623" strokeWidth={2} dot={{ r: 3 }} name="Weight (kg)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Dip volume */}
      {strengthHistory.DIPS.length > 0 && (
        <div className={styles.chartSection}>
          <div className={styles.chartTitle}>Dips — total reps per session</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={strengthHistory.DIPS} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(230,248,248)" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalReps" stroke="#3aa46c" strokeWidth={2} dot={{ r: 3 }} name="Total reps" />
              <Line type="monotone" dataKey="weightKg" stroke="#f5a623" strokeWidth={2} dot={{ r: 3 }} name="Weight (kg)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Exercise completion */}
      {completionBarData.length > 0 && (
        <div className={styles.chartSection}>
          <div className={styles.chartTitle}>Exercise completion</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={completionBarData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(230,248,248)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="scheduled" fill="rgb(179,228,228)" name="Scheduled" />
              <Bar dataKey="completed" fill="#3aa46c" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {waterTrend.length === 0 && weightHistory.length === 0 && sprintHistory.length === 0 && (
        <div className={styles.noData}>
          No data in this range yet. Start logging your daily habits!
        </div>
      )}
    </>
  );
}
