import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { NextResponse } from 'next/server';
import { handleApiError, AuthenticationError, ForbiddenError, NotFoundError } from '@/lib/errorHandler';
import { PlannerCalorieRemoveSchema, validateData } from '@/lib/validations';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const body = await req.json();
    const validation = validateData(PlannerCalorieRemoveSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { entryId } = validation.data;

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const entry = await prisma.calorieEntry.findUnique({
      where: { id: entryId },
      include: { dailyLog: { select: { userId: true } } },
    });

    if (!entry) throw new NotFoundError('Calorie entry not found');
    if (entry.dailyLog.userId !== user.id) throw new ForbiddenError();

    await prisma.calorieEntry.delete({ where: { id: entryId } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return handleApiError(error, { route: '/api/planner/calories/remove' });
  }
}
