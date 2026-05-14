import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { NextResponse } from 'next/server';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/errorHandler';
import { noonUTC } from '@/lib/plannerHelpers';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new ValidationError('date query param must be YYYY-MM-DD');
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const date = noonUTC(dateStr);
    const dayStart = new Date(dateStr + 'T00:00:00.000Z');
    const dayEnd = new Date(dateStr + 'T23:59:59.999Z');

    const [dailyLog, exerciseSchedules, settings] = await Promise.all([
      prisma.dailyLog.findUnique({
        where: { userId_date: { userId: user.id, date } },
        include: { calorieEntries: { orderBy: { createdAt: 'asc' } } },
      }),
      prisma.exerciseSchedule.findMany({
        where: {
          userId: user.id,
          scheduledDate: { gte: dayStart, lte: dayEnd },
        },
        include: { exerciseLog: true },
        orderBy: { exerciseType: 'asc' },
      }),
      prisma.dailyPlanSettings.findUnique({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      dailyLog: dailyLog ? JSON.parse(JSON.stringify(dailyLog)) : null,
      exerciseSchedules: JSON.parse(JSON.stringify(exerciseSchedules)),
      settings: settings ? JSON.parse(JSON.stringify(settings)) : null,
    });
  } catch (error) {
    return handleApiError(error, { route: 'GET /api/planner/day' });
  }
}
