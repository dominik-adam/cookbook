import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { NextResponse } from 'next/server';
import { handleApiError, AuthenticationError } from '@/lib/errorHandler';
import { PlannerCalorieAddSchema, validateData } from '@/lib/validations';
import { getOrCreateDailyLog } from '@/lib/plannerHelpers';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const body = await req.json();
    const validation = validateData(PlannerCalorieAddSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { date, amount, label } = validation.data;

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const log = await getOrCreateDailyLog(user.id, date);

    const entry = await prisma.calorieEntry.create({
      data: {
        dailyLogId: log.id,
        amount,
        label: label ?? null,
      },
    });

    return NextResponse.json({ entry });
  } catch (error) {
    return handleApiError(error, { route: '/api/planner/calories/add' });
  }
}
