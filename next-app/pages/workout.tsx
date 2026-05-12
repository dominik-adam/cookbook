import Head from 'next/head';
import Layout from '../components/layout';
import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import styles from '@/styles/workout.module.css';
import { useState, useEffect } from 'react';
import type { GetServerSidePropsContext } from 'next';
import type { WorkoutSession, WorkoutStats } from '@/types/workout';

import WorkoutCalendar from '@/components/workout/WorkoutCalendar';
import WorkoutLogModal from '@/components/workout/WorkoutLogModal';
import WorkoutProgress from '@/components/workout/WorkoutProgress';

type ActiveTab = 'calendar' | 'progress';

interface WorkoutPageProps {
  initSessions: WorkoutSession[];
  initYear: number;
  initMonth: number;
}

function padLeft(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toDateStr(isoString: string): string {
  return isoString.slice(0, 10);
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req, res } = context;
  const session = await getServerSession(req, res, options);

  if (!session?.user?.email) {
    return { redirect: { destination: '/', permanent: false } };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { redirect: { destination: '/', permanent: false } };
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId: user.id,
        date: { gte: startDate, lte: endDate },
      },
      include: { exercises: true },
      orderBy: { date: 'asc' },
    });

    return {
      props: {
        initSessions: JSON.parse(JSON.stringify(sessions)),
        initYear: year,
        initMonth: month,
      },
    };
  } catch (error) {
    console.error('Error fetching workout data:', error);
    return {
      props: {
        initSessions: [],
        initYear: new Date().getFullYear(),
        initMonth: new Date().getMonth() + 1,
      },
    };
  }
}

export default function WorkoutPage({ initSessions, initYear, initMonth }: WorkoutPageProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calendar');

  // Calendar state — month is 0-indexed internally, 1-indexed for API calls
  const [currentYear, setCurrentYear] = useState(initYear);
  const [currentMonth, setCurrentMonth] = useState(initMonth - 1); // 0-indexed
  const [sessions, setSessions] = useState<WorkoutSession[]>(initSessions);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<WorkoutSession | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);

  const [exerciseSuggestions, setExerciseSuggestions] = useState<string[]>([]);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);

  // Load exercise suggestions once on mount
  useEffect(() => {
    fetch('/api/get-exercise-suggestions')
      .then((r) => r.json())
      .then((data) => setExerciseSuggestions(data.exercises ?? []))
      .catch(() => {});
  }, []);

  const loadMonthSessions = async (year: number, month: number) => {
    setIsLoadingCalendar(true);
    try {
      const res = await fetch(`/api/get-workouts?year=${year}&month=${month + 1}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions ?? []);
      }
    } catch {
      // keep existing sessions on error
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch('/api/get-workout-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setStatsLoaded(true);
      }
    } catch {
      // keep null stats on error
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleMonthChange = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
    setSelectedDate(null);
    loadMonthSessions(year, month);
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  };

  const handleOpenLogModal = (date?: string) => {
    setSessionToEdit(null);
    setModalDefaultDate(date);
    setIsModalOpen(true);
  };

  const handleEditSession = (session: WorkoutSession) => {
    setSessionToEdit(session);
    setModalDefaultDate(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSessionToEdit(null);
    setModalDefaultDate(undefined);
  };

  const handleModalSaved = () => {
    loadMonthSessions(currentYear, currentMonth);
    if (statsLoaded) loadStats();
    // Reload suggestions to pick up new exercise names
    fetch('/api/get-exercise-suggestions')
      .then((r) => r.json())
      .then((data) => setExerciseSuggestions(data.exercises ?? []))
      .catch(() => {});
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Delete this workout? This cannot be undone.')) return;

    const res = await fetch('/api/delete-workout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setSelectedDate(null);
      if (statsLoaded) loadStats();
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'progress' && !statsLoaded) {
      loadStats();
    }
  };

  const sessionDates = sessions.map((s) => toDateStr(s.date));
  const selectedSession = selectedDate
    ? sessions.find((s) => toDateStr(s.date) === selectedDate) ?? null
    : null;

  return (
    <Layout pageTitle="Workout">
      <Head>
        <title>My Workout</title>
      </Head>

      {/* Tab bar */}
      <div className={styles.tabBar}>
        <button
          className={activeTab === 'calendar' ? styles.tabActive : styles.tab}
          onClick={() => handleTabChange('calendar')}
        >
          Calendar
        </button>
        <button
          className={activeTab === 'progress' ? styles.tabActive : styles.tab}
          onClick={() => handleTabChange('progress')}
        >
          Progress
        </button>
      </div>

      {/* Calendar tab */}
      {activeTab === 'calendar' && (
        <>
          <div className={styles.calendarActions}>
            <button
              className={styles.logButton}
              onClick={() => handleOpenLogModal(selectedDate ?? undefined)}
            >
              + Log Workout
            </button>
          </div>

          <WorkoutCalendar
            year={currentYear}
            month={currentMonth}
            sessionDates={sessionDates}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
            onMonthChange={handleMonthChange}
            isLoading={isLoadingCalendar}
          />

          {/* Day detail panel */}
          {selectedDate && (
            <div className={styles.dayDetail}>
              <div className={styles.dayDetailHeader}>
                <span className={styles.dayDetailTitle}>
                  {formatDisplayDate(selectedDate)}
                </span>
                {selectedSession && (
                  <div className={styles.dayDetailActions}>
                    <button
                      className={styles.editButton}
                      onClick={() => handleEditSession(selectedSession)}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteSession(selectedSession.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {selectedSession ? (
                <>
                  {selectedSession.notes && (
                    <div className={styles.sessionNotes}>{selectedSession.notes}</div>
                  )}
                  {selectedSession.exercises.map((exercise, i) => {
                    const meta: string[] = [];
                    if (exercise.sets != null && exercise.reps != null) {
                      meta.push(`${exercise.sets} × ${exercise.reps} reps`);
                    } else if (exercise.sets != null) {
                      meta.push(`${exercise.sets} sets`);
                    } else if (exercise.reps != null) {
                      meta.push(`${exercise.reps} reps`);
                    }
                    if (exercise.weight != null) meta.push(`${exercise.weight} kg`);
                    if (exercise.duration != null) meta.push(`${exercise.duration} min`);
                    if (exercise.distance != null) meta.push(`${exercise.distance} km`);

                    return (
                      <div key={exercise.id ?? i} className={styles.exerciseCard}>
                        <div className={styles.exerciseName}>{exercise.exerciseName}</div>
                        {meta.length > 0 && (
                          <div className={styles.exerciseMeta}>
                            {meta.map((m) => (
                              <span key={m} className={styles.exerciseMetaItem}>{m}</span>
                            ))}
                          </div>
                        )}
                        {exercise.notes && (
                          <div className={styles.sessionNotes} style={{ marginTop: 6 }}>
                            {exercise.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className={styles.noWorkoutMessage}>
                  <p>No workout logged for this day.</p>
                  <button
                    className={styles.noWorkoutLogButton}
                    onClick={() => handleOpenLogModal(selectedDate)}
                  >
                    Log Workout
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Progress tab */}
      {activeTab === 'progress' && (
        <WorkoutProgress stats={stats} isLoading={isLoadingStats} />
      )}

      {/* Log / Edit modal */}
      <WorkoutLogModal
        isOpen={isModalOpen}
        sessionToEdit={sessionToEdit}
        exerciseSuggestions={exerciseSuggestions}
        defaultDate={modalDefaultDate}
        onClose={handleCloseModal}
        onSaved={handleModalSaved}
      />
    </Layout>
  );
}
