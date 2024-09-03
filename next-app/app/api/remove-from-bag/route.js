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
    const ingredientId = searchParams.get('ingredientId');
    const unitId = searchParams.get('unitId');
    // TODO add validation


    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: session.user.email == "ttodova@gmail.com" ? "adam.dominik@gmail.com" : session.user.email,
      },
    });

    const entryToDelete = await prisma.bagIngredient.findUnique({
      where: {
        bagIngredientId: {
          userId: user.id,
          ingredientId: ingredientId,
          unitId: unitId
        }
      }
    });

    if (entryToDelete) {
      await prisma.bagIngredient.delete({
        where: {
          bagIngredientId: {
            userId: user.id,
            ingredientId: ingredientId,
            unitId: unitId
          }
        }
      });
  
      await prisma.bagIngredient.updateMany({
        where: {
          userId: user.id,
          order: {
            gt: entryToDelete.order,
          },
        },
        data: {
          order: {
            decrement: 1,
          },
        },
      });
    }

    return NextResponse.json({});
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500});
  } finally {
    await prisma.$disconnect();
  }
}
