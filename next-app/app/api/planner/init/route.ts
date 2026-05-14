import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { NextResponse } from 'next/server';
import { handleApiError, AuthenticationError } from '@/lib/errorHandler';
import { generateAllSchedules } from '@/lib/plannerSchedule';

export async function POST() {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const existing = await prisma.dailyPlanSettings.findUnique({
      where: { userId: user.id },
    });

    if (existing) {
      return NextResponse.json({ settings: existing, alreadyInitialized: true });
    }

    const settings = await prisma.dailyPlanSettings.create({
      data: { userId: user.id },
    });

    await generateAllSchedules(
      user.id,
      settings.sprintFrequencyDays,
      settings.pullupFrequencyDays,
      settings.dipFrequencyDays
    );

    return NextResponse.json({ settings, alreadyInitialized: false });
  } catch (error) {
    return handleApiError(error, { route: '/api/planner/init' });
  }
}
