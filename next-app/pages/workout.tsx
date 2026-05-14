import Head from 'next/head';
import Layout from '../components/layout';
import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import styles from '@/styles/planner.module.css';
import { useState, useEffect, useCallback } from 'react';
import type { GetServerSidePropsContext } from 'next';
import type { DayData, DailyPlanSettings, MonthData, PlannerStats } from '@/types/planner';

import DayView from '@/components/workout/DayView';
import MonthCalendar from '@/components/workout/MonthCalendar';
import PlannerStatsComponent from '@/components/workout/PlannerStats';
import PlanSettings from '@/components/workout/PlanSettings';

type ActiveTab = 'today' | 'calendar' | 'stats';

interface WorkoutPageProps {
  initSettings: DailyPlanSettings | null;
  initDayData: DayData | null;
  initYear: number;
  initMonth: number;
  initDate: string;
  needsInit: boolean;
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

    if (!user) return { redirect: { destination: '/', permanent: false } };

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const settings = await prisma.dailyPlanSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings) {
      return {
        props: {
          initSettings: null,
          initDayData: null,
          initYear: year,
          initMonth: month,
          initDate: dateStr,
          needsInit: true,
        },
      };
    }

    const date = new Date(dateStr + 'T12:00:00.000Z');
    const dayStart = new Date(dateStr + 'T00:00:00.000Z');
    const dayEnd = new Date(dateStr + 'T23:59:59.999Z');

    const [dailyLog, exerciseSchedules] = await Promise.all([
      prisma.dailyLog.findUnique({
        where: { userId_date: { userId: user.id, date } },
        include: { calorieEntries: { orderBy: { createdAt: 'asc' } } },
      }),
      prisma.exerciseSchedule.findMany({
        where: { userId: user.id, scheduledDate: { gte: dayStart, lte: dayEnd } },
        include: { exerciseLog: true },
        orderBy: { exerciseType: 'asc' },
      }),
    ]);

    const initDayData: DayData = {
      dailyLog: dailyLog ? JSON.parse(JSON.stringify(dailyLog)) : null,
      exerciseSchedules: JSON.parse(JSON.stringify(exerciseSchedules)),
      settings: JSON.parse(JSON.stringify(settings)),
    };

    return {
      props: {
        initSettings: JSON.parse(JSON.stringify(settings)),
        initDayData,
        initYear: year,
        initMonth: month,
        initDate: dateStr,
        needsInit: false,
      },
    };
  } catch (error) {
    console.error('Error loading workout page:', error);
    const now = new Date();
    return {
      props: {
        initSettings: null,
        initDayData: null,
        initYear: now.getFullYear(),
        initMonth: now.getMonth() + 1,
        initDate: todayStr(),
        needsInit: true,
      },
    };
  }
}

export default function WorkoutPage({
  initSettings,
  initDayData,
  initYear,
  initMonth,
  initDate,
  needsInit,
}: WorkoutPageProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [selectedDate, setSelectedDate] = useState(initDate);
  const [dayData, setDayData] = useState<DayData | null>(initDayData);
  const [isDayLoading, setIsDayLoading] = useState(false);
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [isMonthLoading, setIsMonthLoading] = useState(false);
  const [currentYear, setCurrentYear] = useState(initYear);
  const [currentMonth, setCurrentMonth] = useState(initMonth - 1); // 0-indexed
  const [statsData, setStatsData] = useState<PlannerStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [statsRangeDays, setStatsRangeDays] = useState(90);
  const [settings, setSettings] = useState<DailyPlanSettings | null>(initSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize plan on first visit
  useEffect(() => {
    if (!needsInit) return;
    (async () => {
      try {
        const res = await fetch('/api/planner/init', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
          await loadDay(initDate, true);
        }
      } catch {
        // ignore — user will see empty state
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDay = useCallback(async (dateStr: string, silent = false) => {
    if (!silent) setIsDayLoading(true);
    try {
      const res = await fetch(`/api/planner/day?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setDayData(data);
        if (data.settings) setSettings(data.settings);
      }
    } catch {
      // keep existing data
    } finally {
      setIsDayLoading(false);
    }
  }, []);

  const loadMonth = useCallback(async (year: number, month: number) => {
    setIsMonthLoading(true);
    try {
      const res = await fetch(`/api/planner/month?year=${year}&month=${month + 1}`);
      if (res.ok) {
        const data = await res.json();
        setMonthData(data);
      }
    } catch {
      // keep existing
    } finally {
      setIsMonthLoading(false);
    }
  }, []);

  const loadStats = useCallback(async (days: number) => {
    setIsStatsLoading(true);
    try {
      let url = '/api/planner/stats';
      if (days > 0) {
        const to = new Date();
        const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
        const toStr = to.toISOString().slice(0, 10);
        const fromStr = from.toISOString().slice(0, 10);
        url += `?from=${fromStr}&to=${toStr}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStatsData(data.stats);
        setStatsLoaded(true);
      }
    } catch {
      // keep existing
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  function handleDateChange(dateStr: string) {
    setSelectedDate(dateStr);
    loadDay(dateStr);
  }

  function handleDayUpdated() {
    loadDay(selectedDate);
  }

  function handleTabChange(tab: ActiveTab) {
    setActiveTab(tab);
    if (tab === 'calendar' && !monthData) {
      loadMonth(currentYear, currentMonth);
    }
    if (tab === 'stats' && !statsLoaded) {
      loadStats(statsRangeDays);
    }
  }

  function handleMonthChange(year: number, month: number) {
    setCurrentYear(year);
    setCurrentMonth(month);
    loadMonth(year, month);
  }

  function handleCalendarDayClick(dateStr: string) {
    setSelectedDate(dateStr);
    setActiveTab('today');
    loadDay(dateStr);
  }

  function handleStatsRangeChange(days: number) {
    setStatsRangeDays(days);
    loadStats(days);
  }

  function handleSettingsSaved(newSettings: DailyPlanSettings) {
    setSettings(newSettings);
    // Reload current day in case targets changed
    loadDay(selectedDate);
    // Reload month if on calendar tab
    if (activeTab === 'calendar') loadMonth(currentYear, currentMonth);
  }

  return (
    <Layout pageTitle="Workout">
      <Head>
        <title>Daily Planner</title>
      </Head>

      {/* Tab bar + gear */}
      <div className={styles.tabBar}>
        <button
          className={activeTab === 'today' ? styles.tabActive : styles.tab}
          onClick={() => handleTabChange('today')}
        >
          Today
        </button>
        <button
          className={activeTab === 'calendar' ? styles.tabActive : styles.tab}
          onClick={() => handleTabChange('calendar')}
        >
          Calendar
        </button>
        <button
          className={activeTab === 'stats' ? styles.tabActive : styles.tab}
          onClick={() => handleTabChange('stats')}
        >
          Stats
        </button>
        <div className={styles.tabBarSpacer} />
        <button
          className={styles.gearButton}
          onClick={() => setIsSettingsOpen(true)}
          title="Plan settings"
          aria-label="Open plan settings"
        >
          ⚙
        </button>
      </div>

      {/* Today tab */}
      {activeTab === 'today' && (
        <DayView
          date={selectedDate}
          dayData={dayData}
          isLoading={isDayLoading}
          settings={settings}
          onDateChange={handleDateChange}
          onDayUpdated={handleDayUpdated}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Calendar tab */}
      {activeTab === 'calendar' && (
        <MonthCalendar
          year={currentYear}
          month={currentMonth}
          monthData={monthData}
          selectedDate={selectedDate}
          isLoading={isMonthLoading}
          onDayClick={handleCalendarDayClick}
          onMonthChange={handleMonthChange}
        />
      )}

      {/* Stats tab */}
      {activeTab === 'stats' && (
        <PlannerStatsComponent
          stats={statsData}
          isLoading={isStatsLoading}
          onRangeChange={handleStatsRangeChange}
        />
      )}

      {/* Settings modal */}
      {settings && (
        <PlanSettings
          isOpen={isSettingsOpen}
          settings={settings}
          onClose={() => setIsSettingsOpen(false)}
          onSaved={handleSettingsSaved}
        />
      )}
    </Layout>
  );
}
