import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { NextResponse } from 'next/server';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/errorHandler';
import { dateToStr } from '@/lib/plannerHelpers';
import type { CalendarExercise, DaySummary, ExerciseType } from '@/types/planner';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const { searchParams } = new URL(req.url);
    const yearStr  = searchParams.get('year');
    const monthStr = searchParams.get('month');

    const year  = parseInt(yearStr  ?? '');
    const month = parseInt(monthStr ?? '');

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new ValidationError('year and month query params are required');
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month, 0, 23, 59, 59, 999);

    const [exerciseSchedules, settings] = await Promise.all([
      prisma.exerciseSchedule.findMany({
        where: {
          userId: user.id,
          scheduledDate: { gte: startDate, lte: endDate },
        },
        include: { exerciseLog: true },
        orderBy: { scheduledDate: 'asc' },
      }),
      prisma.dailyPlanSettings.findUnique({ where: { userId: user.id } }),
    ]);

    const now = new Date();
    const days: Record<string, DaySummary> = {};

    for (const sched of exerciseSchedules) {
      const dateStr = dateToStr(new Date(sched.scheduledDate));
      if (!days[dateStr]) days[dateStr] = { exercises: [] };

      const log    = sched.exerciseLog;
      const isPast = new Date(sched.scheduledDate) < now;
      const type   = sched.exerciseType as ExerciseType;

      // Planned values: prefer log snapshots (already logged), fall back to live settings
      let sprintsPlanned:    number | null = null;
      let setsPlanned:       number | null = null;
      let repsPerSetPlanned: number | null = null;
      let weightKgPlanned:   number | null = null;

      if (log) {
        sprintsPlanned    = log.sprintsPlanned;
        setsPlanned       = log.setsPlanned;
        repsPerSetPlanned = log.repsPerSetPlanned;
        weightKgPlanned   = log.weightKgPlanned;
      } else if (settings) {
        if (type === 'SPRINTS') {
          sprintsPlanned = settings.sprintCount;
        } else if (type === 'PULLUPS') {
          setsPlanned       = settings.pullupSets;
          repsPerSetPlanned = settings.pullupRepsPerSet;
          weightKgPlanned   = settings.pullupWeightKg;
        } else {
          setsPlanned       = settings.dipSets;
          repsPerSetPlanned = settings.dipRepsPerSet;
          weightKgPlanned   = settings.dipWeightKg;
        }
      }

      const entry: CalendarExercise = {
        scheduleId:      sched.id,
        type,
        logged:          !!log,
        fullyCompleted:  log?.fullyCompleted ?? false,
        past:            isPast,
        sprintsDone:     log?.sprintsDone     ?? null,
        sprintsPlanned,
        setResults:      (log?.setResults as number[] | null) ?? null,
        weightKgUsed:    log?.weightKgUsed    ?? null,
        setsPlanned,
        repsPerSetPlanned,
        weightKgPlanned,
      };

      days[dateStr].exercises.push(entry);
    }

    return NextResponse.json({ days });
  } catch (error) {
    return handleApiError(error, { route: 'GET /api/planner/month' });
  }
}
