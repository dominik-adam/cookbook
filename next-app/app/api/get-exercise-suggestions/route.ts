import { prisma } from "@/utils/prisma";
import { getServerSession } from "next-auth/next";
import { options } from 'app/api/auth/[...nextauth]/options';
import { NextResponse } from "next/server";
import { handleApiError, AuthenticationError } from '@/lib/errorHandler';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(options);

    if (!session) {
      throw new AuthenticationError();
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const grouped = await prisma.workoutExercise.groupBy({
      by: ['exerciseName'],
      where: {
        session: { userId: user.id },
      },
      _count: { exerciseName: true },
      orderBy: { _count: { exerciseName: 'desc' } },
      take: 50,
    });

    const exercises = grouped.map((g) => g.exerciseName);

    return NextResponse.json({ exercises });
  } catch (error) {
    return handleApiError(error, { route: '/api/get-exercise-suggestions' });
  }
}
