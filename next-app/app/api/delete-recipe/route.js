import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { NextResponse } from "next/server";

export async function DELETE(req) {
  const session = await getServerSession(options);
  const prisma = new PrismaClient();

  try {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401});
    }

    const searchParams = req.nextUrl.searchParams;
    const recipeId = searchParams.get('recipeId');
    // TODO add validation


    await prisma.recipe.delete({
      where: {
        id: recipeId
      }
    });

    return NextResponse.json({});
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500});
  } finally {
    await prisma.$disconnect();
  }
}
