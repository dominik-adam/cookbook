import { prisma } from "@/utils/prisma";
import { getServerSession } from "next-auth/next";
import { options } from 'app/api/auth/[...nextauth]/options';
import { NextResponse } from "next/server";
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/errorHandler';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(options);

    if (!session) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    if (!yearParam || !monthParam) {
      throw new ValidationError('year and month query params are required');
    }

    const year = parseInt(yearParam, 10);
    const month = parseInt(monthParam, 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new ValidationError('Invalid year or month');
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId: user.id,
        date: { gte: startDate, lte: endDate },
      },
      include: { exercises: true },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    return handleApiError(error, { route: '/api/get-workouts' });
  }
}
