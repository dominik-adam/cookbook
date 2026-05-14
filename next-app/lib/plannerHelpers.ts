import { prisma } from '@/utils/prisma';

export function noonUTC(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00.000Z');
}

export function progressColor(pct: number): string {
  if (pct <= 0) return '#e8e8e8';
  if (pct < 0.5) return '#f5c842';
  if (pct < 0.75) return '#f5a623';
  if (pct < 1) return '#7ec8a0';
  return '#3aa46c';
}

export async function getOrCreateDailyLog(userId: string, dateStr: string) {
  const date = noonUTC(dateStr);

  const existing = await prisma.dailyLog.findUnique({
    where: { userId_date: { userId, date } },
    include: { calorieEntries: { orderBy: { createdAt: 'asc' } } },
  });
  if (existing) return existing;

  const settings = await prisma.dailyPlanSettings.findUniqueOrThrow({
    where: { userId },
  });

  return prisma.dailyLog.create({
    data: {
      userId,
      date,
      waterTargetL: settings.waterTargetL,
      creatineTargetG: settings.creatineTargetG,
      calorieTarget: settings.calorieTarget,
    },
    include: { calorieEntries: true },
  });
}

export function padDate(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function dateToStr(d: Date): string {
  return `${d.getUTCFullYear()}-${padDate(d.getUTCMonth() + 1)}-${padDate(d.getUTCDate())}`;
}
