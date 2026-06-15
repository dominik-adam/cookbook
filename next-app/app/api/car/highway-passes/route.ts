import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { NextResponse } from 'next/server';
import { getCanonicalEmail } from '@/utils/auth';
import { AddHighwayPassSchema, validateData } from '@/lib/validations';
import { handleApiError, AuthenticationError, NotFoundError } from '@/lib/errorHandler';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const body = await req.json();
    const validation = validateData(AddHighwayPassSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: getCanonicalEmail(session.user!.email!) },
    });

    const car = await prisma.car.findUnique({ where: { userId: user.id } });
    if (!car) throw new NotFoundError('Car record not found. Save car details first.');

    const { expiry, ...rest } = validation.data;
    const pass = await prisma.highwayPass.create({
      data: {
        carId: car.id,
        ...rest,
        expiry: expiry ? new Date(expiry) : null,
      },
    });

    return NextResponse.json({ pass });
  } catch (error) {
    return handleApiError(error, { route: '/api/car/highway-passes POST' });
  }
}
