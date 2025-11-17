import { prisma } from "@/utils/prisma";
import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { NextResponse } from "next/server";
import { getCanonicalEmail } from '@/utils/auth';
import { handleApiError, AuthenticationError } from '@/lib/errorHandler';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(options);

    if (!session) {
      throw new AuthenticationError();
    }


    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: getCanonicalEmail(session.user!.email!),
      },
    });

    const bagIngredients = await prisma.bagIngredient.findMany({
      where: {
        userId: user.id,
      },
      include: {
        ingredient: true,
        unit: true
      },
      orderBy: {
        order: 'asc',
      }
    });

    return NextResponse.json({ bagIngredients });
  } catch (error) {
    return handleApiError(error, {
      route: '/api/get-bag',
    });
  }
}
