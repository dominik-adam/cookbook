import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { NextResponse } from 'next/server';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/errorHandler';
import { dateToStr } from '@/lib/plannerHelpers';
import type { DaySummary, ExerciseType } from '@/types/planner';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const { searchParams } = new URL(req.url);
    const yearStr = searchParams.get('year');
    const monthStr = searchParams.get('month');

    const year = parseInt(yearStr ?? '');
    const month = parseInt(monthStr ?? '');

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new ValidationError('year and month query params are required');
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const [dailyLogs, exerciseSchedules] = await Promise.all([
      prisma.dailyLog.findMany({
        where: {
          userId: user.id,
          date: { gte: startDate, lte: endDate },
        },
        include: { calorieEntries: { select: { amount: true } } },
        orderBy: { date: 'asc' },
      }),
      prisma.exerciseSchedule.findMany({
        where: {
          userId: user.id,
          scheduledDate: { gte: startDate, lte: endDate },
        },
        include: { exerciseLog: { select: { fullyCompleted: true } } },
        orderBy: { scheduledDate: 'asc' },
      }),
    ]);

    const now = new Date();

    // Build per-day map
    const days: Record<string, DaySummary> = {};

    for (const log of dailyLogs) {
      const dateStr = dateToStr(new Date(log.date));
      const totalCalories = log.calorieEntries.reduce((sum, e) => sum + e.amount, 0);
      days[dateStr] = {
        waterDone: log.waterConsumedL >= log.waterTargetL,
        creatineDone: log.creatineDone,
        caloriesDone: totalCalories >= log.calorieTarget,
        exercises: [],
      };
    }

    for (const sched of exerciseSchedules) {
      const dateStr = dateToStr(new Date(sched.scheduledDate));
      if (!days[dateStr]) {
        days[dateStr] = {
          waterDone: false,
          creatineDone: false,
          caloriesDone: false,
          exercises: [],
        };
      }
      const isPast = new Date(sched.scheduledDate) < now;
      days[dateStr].exercises.push({
        type: sched.exerciseType as ExerciseType,
        completed: sched.exerciseLog?.fullyCompleted ?? false,
        past: isPast,
      });
    }

    return NextResponse.json({ days });
  } catch (error) {
    return handleApiError(error, { route: 'GET /api/planner/month' });
  }
}
