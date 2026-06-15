import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { NextResponse } from 'next/server';
import { getCanonicalEmail } from '@/utils/auth';
import { UpdateCarSchema, validateData } from '@/lib/validations';
import { handleApiError, AuthenticationError } from '@/lib/errorHandler';

export async function GET() {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: getCanonicalEmail(session.user!.email!) },
    });

    const car = await prisma.car.findUnique({
      where: { userId: user.id },
      include: { highwayPasses: { orderBy: { createdAt: 'asc' } } },
    });

    return NextResponse.json({ car });
  } catch (error) {
    return handleApiError(error, { route: '/api/car GET' });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const body = await req.json();
    const validation = validateData(UpdateCarSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: getCanonicalEmail(session.user!.email!) },
    });

    const data = toDateObjects(validation.data);

    const car = await prisma.car.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
      include: { highwayPasses: { orderBy: { createdAt: 'asc' } } },
    });

    return NextResponse.json({ car });
  } catch (error) {
    return handleApiError(error, { route: '/api/car PATCH' });
  }
}

function toDateObjects(data: Record<string, unknown>) {
  const dateFields = ['pzpExpiry', 'havarijExpiry', 'stkExpiry', 'ekExpiry'] as const;
  const result = { ...data };
  for (const field of dateFields) {
    if (field in result) {
      result[field] = result[field] ? new Date(result[field] as string) : null;
    }
  }
  return result;
}
