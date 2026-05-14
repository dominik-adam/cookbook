import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { NextResponse } from 'next/server';
import { handleApiError, AuthenticationError, ForbiddenError } from '@/lib/errorHandler';
import { PlannerExerciseLogSchema, validateData } from '@/lib/validations';
import type { ProgressionSuggestion } from '@/types/planner';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const body = await req.json();
    const validation = validateData(PlannerExerciseLogSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { scheduleId, sprintsDone, setResults, weightKgUsed, notes, fullyCompleted } = validation.data;

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const schedule = await prisma.exerciseSchedule.findUniqueOrThrow({
      where: { id: scheduleId },
    });

    if (schedule.userId !== user.id) throw new ForbiddenError();

    const settings = await prisma.dailyPlanSettings.findUniqueOrThrow({
      where: { userId: user.id },
    });

    const exerciseType = schedule.exerciseType;
    const snapshotData =
      exerciseType === 'SPRINTS'
        ? { sprintsPlanned: settings.sprintCount }
        : exerciseType === 'PULLUPS'
        ? {
            weightKgPlanned: settings.pullupWeightKg,
            setsPlanned: settings.pullupSets,
            repsPerSetPlanned: settings.pullupRepsPerSet,
          }
        : {
            weightKgPlanned: settings.dipWeightKg,
            setsPlanned: settings.dipSets,
            repsPerSetPlanned: settings.dipRepsPerSet,
          };

    const log = await prisma.exerciseLog.upsert({
      where: { scheduleId },
      create: {
        userId: user.id,
        scheduleId,
        exerciseType,
        date: schedule.scheduledDate,
        sprintsDone: sprintsDone ?? null,
        setResults: setResults ?? null,
        weightKgUsed: weightKgUsed ?? null,
        notes: notes ?? null,
        fullyCompleted,
        ...snapshotData,
      },
      update: {
        sprintsDone: sprintsDone ?? null,
        setResults: setResults ?? null,
        weightKgUsed: weightKgUsed ?? null,
        notes: notes ?? null,
        fullyCompleted,
      },
    });

    // Check auto-progression (only if this log is fully completed)
    let progressionSuggestion: ProgressionSuggestion = null;
    if (fullyCompleted) {
      const recentLogs = await prisma.exerciseLog.findMany({
        where: { userId: user.id, exerciseType },
        orderBy: { date: 'desc' },
        take: 10,
        select: { fullyCompleted: true },
      });

      if (recentLogs.length >= 10 && recentLogs.every((l) => l.fullyCompleted)) {
        const verb = exerciseType === 'SPRINTS' ? 'sprints' : 'reps per set';
        progressionSuggestion = {
          exerciseType: exerciseType as 'SPRINTS' | 'PULLUPS' | 'DIPS',
          message: `10 consecutive completions! Add 1 ${verb} or increase weight by 2.5kg?`,
        };
      }
    }

    return NextResponse.json({ log: JSON.parse(JSON.stringify(log)), progressionSuggestion });
  } catch (error) {
    return handleApiError(error, { route: '/api/planner/exercise/log' });
  }
}
