import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { NextResponse } from 'next/server';
import { getCanonicalEmail } from '@/utils/auth';
import { UpdateSubscriptionSchema, RemoveSubscriptionSchema, validateData } from '@/lib/validations';
import { handleApiError, AuthenticationError, NotFoundError } from '@/lib/errorHandler';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const body = await req.json();
    const validation = validateData(UpdateSubscriptionSchema, { ...body, id: params.id });
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { id, ...data } = validation.data;

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: getCanonicalEmail(session.user!.email!) },
    });

    const existing = await prisma.subscription.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new NotFoundError('Subscription not found');

    const subscription = await prisma.subscription.update({
      where: { id },
      data,
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    return handleApiError(error, { route: '/api/subscriptions/[id] PUT', id: params.id });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const validation = validateData(RemoveSubscriptionSchema, { id: params.id });
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: getCanonicalEmail(session.user!.email!) },
    });

    const existing = await prisma.subscription.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!existing) throw new NotFoundError('Subscription not found');

    await prisma.subscription.delete({ where: { id: params.id } });

    await prisma.subscription.updateMany({
      where: { userId: user.id, order: { gt: existing.order } },
      data: { order: { decrement: 1 } },
    });

    return NextResponse.json({});
  } catch (error) {
    return handleApiError(error, { route: '/api/subscriptions/[id] DELETE', id: params.id });
  }
}
