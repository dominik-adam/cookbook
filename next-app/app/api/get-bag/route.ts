import { prisma } from "@/utils/prisma";
import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { NextResponse } from "next/server";
import { getCanonicalEmail } from '@/utils/auth';

export async function GET(req: Request) {
  const session = await getServerSession(options);

  try {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401});
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
    return NextResponse.json({ error: error.message }, { status: 500});
  }
}
