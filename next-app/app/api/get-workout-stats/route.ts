import { prisma } from "@/utils/prisma";
import { getServerSession } from "next-auth/next";
import { options } from 'app/api/auth/[...nextauth]/options';
import { NextResponse } from "next/server";
import { handleApiError, AuthenticationError } from '@/lib/errorHandler';

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function calcStreak(sessionDates: Set<string>): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const cursor = new Date(today);

  if (!sessionDates.has(toDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!sessionDates.has(toDateStr(cursor))) {
      return 0;
    }
  }

  while (sessionDates.has(toDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(options);

    if (!session) {
      throw new AuthenticationError();
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const now = new Date();

    const allSessions = await prisma.workoutSession.findMany({
      where: { userId: user.id },
      select: { date: true },
      orderBy: { date: 'desc' },
    });

    const allDateStrs = allSessions.map((s) => toDateStr(s.date));
    const sessionDateSet = new Set(allDateStrs);

    const streak = calcStreak(sessionDateSet);

    const dayOfWeek = now.getDay();
    const daysFromMon = (dayOfWeek + 6) % 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMon);
    weekStart.setHours(0, 0, 0, 0);
    const thisWeekCount = allSessions.filter((s) => s.date >= weekStart).length;

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCount = allSessions.filter((s) => s.date >= monthStart).length;

    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(now.getDate() - 89);
    ninetyDaysAgo.setHours(0, 0, 0, 0);
    const activityDates = allDateStrs.filter((d) => new Date(d) >= ninetyDaysAgo);

    const exerciseRows = await prisma.workoutExercise.findMany({
      where: { session: { userId: user.id } },
      select: {
        exerciseName: true,
        sets: true,
        reps: true,
        weight: true,
        duration: true,
        distance: true,
        session: { select: { date: true } },
      },
      orderBy: { session: { date: 'desc' } },
    });

    const exerciseHistory: Record<string, Array<{
      date: string;
      sets?: number | null;
      reps?: number | null;
      weight?: number | null;
      duration?: number | null;
      distance?: number | null;
    }>> = {};

    for (const row of exerciseRows) {
      const name = row.exerciseName;
      if (!exerciseHistory[name]) {
        exerciseHistory[name] = [];
      }
      if (exerciseHistory[name].length < 10) {
        exerciseHistory[name].push({
          date: toDateStr(row.session.date),
          sets: row.sets,
          reps: row.reps,
          weight: row.weight,
          duration: row.duration,
          distance: row.distance,
        });
      }
    }

    return NextResponse.json({
      streak,
      thisWeekCount,
      thisMonthCount,
      activityDates,
      exerciseHistory,
    });
  } catch (error) {
    return handleApiError(error, { route: '/api/get-workout-stats' });
  }
}
