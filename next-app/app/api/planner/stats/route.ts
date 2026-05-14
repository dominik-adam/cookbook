import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { NextResponse } from 'next/server';
import { handleApiError, AuthenticationError } from '@/lib/errorHandler';
import { dateToStr } from '@/lib/plannerHelpers';
import type { ExerciseType, PlannerStats } from '@/types/planner';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');

    const to = toStr ? new Date(toStr + 'T23:59:59.999Z') : new Date();
    const from = fromStr
      ? new Date(fromStr + 'T00:00:00.000Z')
      : new Date(to.getTime() - 89 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const [dailyLogs, exerciseLogs, exerciseSchedules] = await Promise.all([
      prisma.dailyLog.findMany({
        where: { userId: user.id, date: { gte: from, lte: to } },
        include: { calorieEntries: { select: { amount: true } } },
        orderBy: { date: 'asc' },
      }),
      prisma.exerciseLog.findMany({
        where: { userId: user.id, date: { gte: from, lte: to } },
        orderBy: { date: 'asc' },
      }),
      prisma.exerciseSchedule.findMany({
        where: { userId: user.id, scheduledDate: { gte: from, lte: to } },
        select: { exerciseType: true, exerciseLog: { select: { id: true } } },
      }),
    ]);

    // Daily habit trends
    const waterTrend = dailyLogs.map((l) => ({
      date: dateToStr(new Date(l.date)),
      consumed: l.waterConsumedL,
      target: l.waterTargetL,
    }));

    const calorieTrend = dailyLogs.map((l) => {
      const consumed = l.calorieEntries.reduce((sum, e) => sum + e.amount, 0);
      return { date: dateToStr(new Date(l.date)), consumed, target: l.calorieTarget };
    });

    const weightHistory = dailyLogs
      .filter((l) => l.weightKg != null)
      .map((l) => ({ date: dateToStr(new Date(l.date)), weightKg: l.weightKg! }));

    // Exercise logs split by type
    const sprintLogs = exerciseLogs.filter((l) => l.exerciseType === 'SPRINTS');
    const pullupLogs = exerciseLogs.filter((l) => l.exerciseType === 'PULLUPS');
    const dipLogs = exerciseLogs.filter((l) => l.exerciseType === 'DIPS');

    const sprintHistory = sprintLogs.map((l) => ({
      date: dateToStr(new Date(l.date)),
      done: l.sprintsDone ?? 0,
      planned: l.sprintsPlanned ?? 0,
    }));

    const toStrengthPoint = (l: (typeof pullupLogs)[number]) => {
      const results = (l.setResults as number[] | null) ?? [];
      const totalReps = results.reduce((s, r) => s + r, 0);
      return { date: dateToStr(new Date(l.date)), totalReps, weightKg: l.weightKgUsed ?? 0 };
    };

    const strengthHistory = {
      PULLUPS: pullupLogs.map(toStrengthPoint),
      DIPS: dipLogs.map(toStrengthPoint),
    };

    // Completion rates
    const rates: Record<ExerciseType, { scheduled: number; completed: number }> = {
      SPRINTS: { scheduled: 0, completed: 0 },
      PULLUPS: { scheduled: 0, completed: 0 },
      DIPS: { scheduled: 0, completed: 0 },
    };
    for (const s of exerciseSchedules) {
      const t = s.exerciseType as ExerciseType;
      rates[t].scheduled++;
      if (s.exerciseLog) rates[t].completed++;
    }

    // Summary
    const daysWithWaterMet = dailyLogs.filter((l) => l.waterConsumedL >= l.waterTargetL).length;
    const daysWithCreatine = dailyLogs.filter((l) => l.creatineDone).length;
    const daysWithCaloriesMet = calorieTrend.filter((d) => d.consumed >= d.target).length;

    const stats: PlannerStats = {
      waterTrend,
      calorieTrend,
      weightHistory,
      sprintHistory,
      strengthHistory,
      exerciseCompletionRates: rates,
      summary: {
        daysWithWaterMet,
        daysWithCreatine,
        daysWithCaloriesMet,
        totalDaysLogged: dailyLogs.length,
      },
    };

    return NextResponse.json({ stats });
  } catch (error) {
    return handleApiError(error, { route: 'GET /api/planner/stats' });
  }
}
