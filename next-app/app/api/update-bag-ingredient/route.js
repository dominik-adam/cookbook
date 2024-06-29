import { getServerSession } from "next-auth/next"
import { PrismaClient } from '@prisma/client';
import { options } from 'app/api/auth/[...nextauth]/options'
import { NextResponse } from "next/server";

export async function POST(req) {
  const session = await getServerSession(options)
  const prisma = new PrismaClient();

  try {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401});
    }

    const { 
      ingredientId,
      unitId,
      amount,
      note
    } = await req.json();
    // TODO add validation
    
    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: session.user.email == "ttodova@gmail.com" ? "adam.dominik@gmail.com" : session.user.email,
      },
    });

    const bagIngredient = await prisma.bagIngredient.update({
      where: {
        bagIngredientId: {
          userId: user.id,
          ingredientId: ingredientId,
          unitId: unitId
        },
      },
      data: {
        amount: amount,
        note: note,
      }
    });

    return NextResponse.json({ message: 'Bag item updated successfully' });
  } catch (error) {
    // TODO add general error message, specific is for debugging only 
    return NextResponse.json({ error: error.message }, { status: 500});
  } finally {
    await prisma.$disconnect();
  }
}
