import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { NextResponse } from 'next/server';
import { getCanonicalEmail } from '@/utils/auth';
import { AddSubscriptionSchema, validateData } from '@/lib/validations';
import { handleApiError, AuthenticationError } from '@/lib/errorHandler';

export async function GET() {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: getCanonicalEmail(session.user!.email!) },
    });

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    return handleApiError(error, { route: '/api/subscriptions GET' });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const body = await req.json();
    const validation = validateData(AddSubscriptionSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: getCanonicalEmail(session.user!.email!) },
    });

    const maxOrder = await prisma.subscription.aggregate({
      where: { userId: user.id },
      _max: { order: true },
    });

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        order: (maxOrder._max.order || 0) + 1,
        ...validation.data,
      },
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    return handleApiError(error, { route: '/api/subscriptions POST' });
  }
}
