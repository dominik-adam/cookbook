import { getServerSession } from "next-auth/next";
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from "@/utils/prisma";
import { NextResponse } from "next/server";
import { DeleteWorkoutSchema, validateData } from '@/lib/validations';
import { handleApiError, AuthenticationError, ForbiddenError, NotFoundError } from '@/lib/errorHandler';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(options);

    if (!session) {
      throw new AuthenticationError();
    }

    const body = await req.json();
    const validation = validateData(DeleteWorkoutSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { sessionId } = validation.data;

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

    await prisma.workoutSession.delete({ where: { id: sessionId } });

    return NextResponse.json({ message: 'Workout deleted' });
  } catch (error) {
    return handleApiError(error, { route: '/api/delete-workout' });
  }
}
