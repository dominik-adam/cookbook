import { getServerSession } from "next-auth/next";
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from "@/utils/prisma";
import { NextResponse } from "next/server";
import { UpdateWorkoutSchema, validateData } from '@/lib/validations';
import { handleApiError, AuthenticationError, ForbiddenError, NotFoundError } from '@/lib/errorHandler';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(options);

    if (!session) {
      throw new AuthenticationError();
    }

    const body = await req.json();
    const validation = validateData(UpdateWorkoutSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { sessionId, date, notes, exercises } = validation.data;

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const existing = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
    });

    if (!existing) {
      throw new NotFoundError('Workout session not found');
    }

    if (existing.userId !== user.id) {
      throw new ForbiddenError();
    }

    const dateTime = new Date(date + 'T12:00:00.000Z');

    await prisma.workoutExercise.deleteMany({ where: { sessionId } });

    const workoutSession = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        date: dateTime,
        notes: notes ?? null,
        exercises: { create: exercises },
      },
      include: { exercises: true },
    });

    return NextResponse.json({ session: workoutSession });
  } catch (error) {
    return handleApiError(error, { route: '/api/update-workout' });
  }
}
