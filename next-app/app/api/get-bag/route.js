import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { NextResponse } from "next/server";

export async function GET(req) {
  const session = await getServerSession(options);
  const prisma = new PrismaClient();

  try {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401});
    }


    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: session.user.email == "ttodova@gmail.com" ? "adam.dominik@gmail.com" : session.user.email,
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
  } finally {
    await prisma.$disconnect();
  }
}
