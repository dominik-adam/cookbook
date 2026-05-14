import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { NextResponse } from 'next/server';
import { handleApiError, AuthenticationError, ForbiddenError, ConflictError } from '@/lib/errorHandler';
import { PlannerRescheduleSchema, validateData } from '@/lib/validations';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const body = await req.json();
    const validation = validateData(PlannerRescheduleSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { scheduleId, direction } = validation.data;

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const schedule = await prisma.exerciseSchedule.findUniqueOrThrow({
      where: { id: scheduleId },
      include: { exerciseLog: { select: { id: true } } },
    });

    if (schedule.userId !== user.id) throw new ForbiddenError();
    if (schedule.exerciseLog) {
      throw new ConflictError('Cannot reschedule a completed exercise');
    }

    const current = new Date(schedule.scheduledDate);
    const newDate = new Date(current);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));

    // Check for conflict on the new date
    const conflict = await prisma.exerciseSchedule.findUnique({
      where: {
        userId_exerciseType_scheduledDate: {
          userId: user.id,
          exerciseType: schedule.exerciseType,
          scheduledDate: newDate,
        },
      },
    });

    if (conflict) {
      throw new ConflictError(`An ${schedule.exerciseType} session is already scheduled on that day`);
    }

    const updated = await prisma.exerciseSchedule.update({
      where: { id: scheduleId },
      data: { scheduledDate: newDate },
      include: { exerciseLog: true },
    });

    return NextResponse.json({ schedule: JSON.parse(JSON.stringify(updated)) });
  } catch (error) {
    return handleApiError(error, { route: '/api/planner/exercise/reschedule' });
  }
}
