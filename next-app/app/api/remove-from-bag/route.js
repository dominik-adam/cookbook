import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { NextResponse } from "next/server";

export async function DELETE(req) {
  const session = await getServerSession(options);

  try {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401});
    }

    const searchParams = req.nextUrl.searchParams;
    const ingredientId = searchParams.get('ingredientId');
    const unitId = searchParams.get('unitId');
    // TODO add validation

    const prisma = new PrismaClient();

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: session.user.email == "ttodova@gmail.com" ? "adam.dominik@gmail.com" : session.user.email,
      },
    });

    await prisma.bagIngredient.delete({
      where: {
        id: {
          userId: user.id,
          ingredientId: ingredientId,
          unitId: unitId
        }
      }
    });

    return NextResponse.json({});
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500});
  }
}
