import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { NextResponse } from 'next/server';
import { handleApiError, AuthenticationError, NotFoundError } from '@/lib/errorHandler';
import { PlannerSettingsUpdateSchema, validateData } from '@/lib/validations';
import { generateSchedule } from '@/lib/plannerSchedule';
import type { ExerciseType } from '@/types/planner';

const START_DATE_KEYS = ['sprintStartDate', 'pullupStartDate', 'dipStartDate'] as const;
type StartDateKey = typeof START_DATE_KEYS[number];

function toNoonUTC(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00.000Z');
}

// Compare a DB DateTime (noon UTC) to an incoming YYYY-MM-DD string
function startDateChanged(dbVal: unknown, incoming: string | null | undefined): boolean {
  const current = (dbVal instanceof Date) ? dbVal.toISOString().slice(0, 10) : null;
  const next = incoming !== undefined ? (incoming ?? null) : current;
  return next !== current;
}

export async function GET() {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const settings = await prisma.dailyPlanSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings) throw new NotFoundError('Plan settings not found. Initialize first.');

    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error, { route: 'GET /api/planner/settings' });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const body = await req.json();
    const validation = validateData(PlannerSettingsUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const current = await prisma.dailyPlanSettings.findUniqueOrThrow({
      where: { userId: user.id },
    });

    // Separate start-date fields from the rest so we never pass unknown fields to the
    // Prisma-generated update() method (which doesn't know about them until prisma generate runs).
    const startDateValues: Partial<Record<StartDateKey, Date | null>> = {};
    const regularData: Record<string, unknown> = { ...validation.data };
    for (const key of START_DATE_KEYS) {
      if (key in regularData) {
        const val = regularData[key];
        startDateValues[key] = typeof val === 'string' ? toNoonUTC(val) : null;
        delete regularData[key];
      }
    }

    // Update all non-start-date fields through the normal Prisma client
    const updated = await prisma.dailyPlanSettings.update({
      where: { userId: user.id },
      data: regularData,
    });

    // Update start-date columns via raw SQL so this works even without prisma generate.
    // Requires the migration (add_exercise_start_dates) to have been applied first.
    if (START_DATE_KEYS.some((k) => k in startDateValues)) {
      const sd = startDateValues.sprintStartDate !== undefined ? startDateValues.sprintStartDate : null;
      const pd = startDateValues.pullupStartDate !== undefined ? startDateValues.pullupStartDate : null;
      const dd = startDateValues.dipStartDate !== undefined ? startDateValues.dipStartDate : null;
      await prisma.$executeRaw`
        UPDATE "DailyPlanSettings"
        SET "sprintStartDate" = ${sd},
            "pullupStartDate" = ${pd},
            "dipStartDate"    = ${dd}
        WHERE "userId" = ${user.id}
      `;
    }

    // Regenerate schedules for any exercise whose frequency OR start date changed
    const rescheduled: ExerciseType[] = [];
    const freqs: Partial<Record<ExerciseType, number>> = {};
    const startDates: Partial<Record<ExerciseType, string | null>> = {};

    const d = validation.data;
    const cur = current as Record<string, unknown>;

    if ((d.sprintFrequencyDays !== undefined && d.sprintFrequencyDays !== current.sprintFrequencyDays) ||
        startDateChanged(cur.sprintStartDate, d.sprintStartDate)) {
      freqs.SPRINTS = d.sprintFrequencyDays ?? current.sprintFrequencyDays;
      startDates.SPRINTS = d.sprintStartDate !== undefined ? (d.sprintStartDate ?? null) : null;
      rescheduled.push('SPRINTS');
    }
    if ((d.pullupFrequencyDays !== undefined && d.pullupFrequencyDays !== current.pullupFrequencyDays) ||
        startDateChanged(cur.pullupStartDate, d.pullupStartDate)) {
      freqs.PULLUPS = d.pullupFrequencyDays ?? current.pullupFrequencyDays;
      startDates.PULLUPS = d.pullupStartDate !== undefined ? (d.pullupStartDate ?? null) : null;
      rescheduled.push('PULLUPS');
    }
    if ((d.dipFrequencyDays !== undefined && d.dipFrequencyDays !== current.dipFrequencyDays) ||
        startDateChanged(cur.dipStartDate, d.dipStartDate)) {
      freqs.DIPS = d.dipFrequencyDays ?? current.dipFrequencyDays;
      startDates.DIPS = d.dipStartDate !== undefined ? (d.dipStartDate ?? null) : null;
      rescheduled.push('DIPS');
    }

    if (Object.keys(freqs).length > 0) {
      await generateSchedule(user.id, freqs as Record<ExerciseType, number>, 365, startDates);
    }

    // Merge start dates into the response so the client receives a complete settings object
    const responseSettings = {
      ...updated,
      sprintStartDate: startDateValues.sprintStartDate !== undefined
        ? startDateValues.sprintStartDate?.toISOString() ?? null
        : (cur.sprintStartDate instanceof Date ? cur.sprintStartDate.toISOString() : null),
      pullupStartDate: startDateValues.pullupStartDate !== undefined
        ? startDateValues.pullupStartDate?.toISOString() ?? null
        : (cur.pullupStartDate instanceof Date ? cur.pullupStartDate.toISOString() : null),
      dipStartDate: startDateValues.dipStartDate !== undefined
        ? startDateValues.dipStartDate?.toISOString() ?? null
        : (cur.dipStartDate instanceof Date ? cur.dipStartDate.toISOString() : null),
    };

    return NextResponse.json({ settings: responseSettings, rescheduled });
  } catch (error) {
    return handleApiError(error, { route: 'POST /api/planner/settings' });
  }
}
