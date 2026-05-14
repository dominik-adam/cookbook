import { prisma } from '@/utils/prisma';
import type { ExerciseType } from '@/types/planner';

type Frequencies = {
  SPRINTS: number;
  PULLUPS: number;
  DIPS: number;
};

type StartDates = Partial<Record<ExerciseType, string | null>>;

function noonUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function parseNoon(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00.000Z');
}

export async function generateSchedule(
  userId: string,
  frequencies: Partial<Frequencies>,
  daysAhead = 365,
  startDates: StartDates = {}
): Promise<void> {
  const now = new Date();
  const todayNoon = noonUTC(now);
  const endDate = addDays(todayNoon, daysAhead);

  const exerciseTypes = Object.keys(frequencies) as ExerciseType[];

  for (const exerciseType of exerciseTypes) {
    const frequencyDays = frequencies[exerciseType]!;
    const startDateStr = startDates[exerciseType];

    if (startDateStr) {
      // Start date specified: delete ALL unlogged schedules from today onwards
      // (inclusive, since the whole sequence is being re-anchored)
      await prisma.exerciseSchedule.deleteMany({
        where: {
          userId,
          exerciseType,
          scheduledDate: { gte: todayNoon },
          exerciseLog: { is: null },
        },
      });

      // Anchor from the given start date, advance until strictly after today
      let cursor = parseNoon(startDateStr);
      while (cursor <= todayNoon) {
        cursor = addDays(cursor, frequencyDays);
      }

      const datesToCreate: Date[] = [];
      while (cursor <= endDate) {
        datesToCreate.push(new Date(cursor));
        cursor = addDays(cursor, frequencyDays);
      }

      if (datesToCreate.length > 0) {
        await prisma.exerciseSchedule.createMany({
          data: datesToCreate.map((d) => ({ userId, exerciseType, scheduledDate: d })),
          skipDuplicates: true,
        });
      }
    } else {
      // No start date: delete only strictly-future unlogged schedules, anchor from last
      await prisma.exerciseSchedule.deleteMany({
        where: {
          userId,
          exerciseType,
          scheduledDate: { gt: todayNoon },
          exerciseLog: { is: null },
        },
      });

      const lastSchedule = await prisma.exerciseSchedule.findFirst({
        where: { userId, exerciseType },
        orderBy: { scheduledDate: 'desc' },
      });

      let cursor: Date;
      if (!lastSchedule) {
        cursor = new Date(todayNoon);
      } else {
        cursor = noonUTC(new Date(lastSchedule.scheduledDate));
        while (cursor <= todayNoon) {
          cursor = addDays(cursor, frequencyDays);
        }
      }

      const datesToCreate: Date[] = [];
      while (cursor <= endDate) {
        datesToCreate.push(new Date(cursor));
        cursor = addDays(cursor, frequencyDays);
      }

      if (datesToCreate.length > 0) {
        await prisma.exerciseSchedule.createMany({
          data: datesToCreate.map((d) => ({ userId, exerciseType, scheduledDate: d })),
          skipDuplicates: true,
        });
      }
    }
  }
}

export async function generateAllSchedules(
  userId: string,
  sprintFrequencyDays: number,
  pullupFrequencyDays: number,
  dipFrequencyDays: number,
  daysAhead = 365
): Promise<void> {
  await generateSchedule(
    userId,
    {
      SPRINTS: sprintFrequencyDays,
      PULLUPS: pullupFrequencyDays,
      DIPS: dipFrequencyDays,
    },
    daysAhead
  );
}
