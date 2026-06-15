import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { NextResponse } from 'next/server';
import { getCanonicalEmail } from '@/utils/auth';
import { UpdateHighwayPassSchema, validateData } from '@/lib/validations';
import { handleApiError, AuthenticationError, NotFoundError } from '@/lib/errorHandler';

async function resolveOwnership(passId: string, userId: string) {
  const pass = await prisma.highwayPass.findFirst({
    where: { id: passId, car: { userId } },
  });
  if (!pass) throw new NotFoundError('Highway pass not found');
  return pass;
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const body = await req.json();
    const validation = validateData(UpdateHighwayPassSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: getCanonicalEmail(session.user!.email!) },
    });

    await resolveOwnership(params.id, user.id);

    const { expiry, ...rest } = validation.data;
    const pass = await prisma.highwayPass.update({
      where: { id: params.id },
      data: { ...rest, expiry: expiry ? new Date(expiry) : null },
    });

    return NextResponse.json({ pass });
  } catch (error) {
    return handleApiError(error, { route: '/api/car/highway-passes/[id] PUT', id: params.id });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: getCanonicalEmail(session.user!.email!) },
    });

    await resolveOwnership(params.id, user.id);
    await prisma.highwayPass.delete({ where: { id: params.id } });

    return NextResponse.json({});
  } catch (error) {
    return handleApiError(error, { route: '/api/car/highway-passes/[id] DELETE', id: params.id });
  }
}
