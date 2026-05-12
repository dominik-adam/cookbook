import { getServerSession } from "next-auth/next";
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from "@/utils/prisma";
import { NextResponse } from "next/server";
import { LogWorkoutSchema, validateData } from '@/lib/validations';
import { handleApiError, AuthenticationError } from '@/lib/errorHandler';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(options);

    if (!session) {
      throw new AuthenticationError();
    }

    const body = await req.json();
    const validation = validateData(LogWorkoutSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { date, notes, exercises } = validation.data;

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const dateTime = new Date(date + 'T12:00:00.000Z');

    const workoutSession = await prisma.workoutSession.upsert({
      where: { userId_date: { userId: user.id, date: dateTime } },
      create: {
        userId: user.id,
        date: dateTime,
        notes: notes ?? null,
        exercises: { create: exercises },
      },
      update: {
        notes: notes ?? null,
        exercises: {
          deleteMany: {},
          create: exercises,
        },
      },
      include: { exercises: true },
    });

    return NextResponse.json({ session: workoutSession });
  } catch (error) {
    return handleApiError(error, { route: '/api/log-workout' });
  }
}
