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

    const { recipeId, clearState } = await req.json();
    // TODO add validation
    
    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: session.user.email == "ttodova@gmail.com" ? "adam.dominik@gmail.com" : session.user.email,
      },
    });

    const recipeState = await prisma.recipeIngredientState.findUnique({
      where: {
        id: {
          recipeId: recipeId,
          userId: user.id,
        }
      },
    });

    if (recipeState) {
      const updateRecipeState = await prisma.recipeIngredientState.update({
        where: {
          id: {
            recipeId: recipeId,
            userId: user.id,
          }
        },
        data: {
          state: clearState
        },
      })
    } else {
      const recipeStateCreateData = {
        recipeId: recipeId,
        userId: user.id,
        state: clearState,
      }

      const createRecipeState = await prisma.recipeIngredientState.create({
        data: recipeStateCreateData,
      })
    }

    return NextResponse.json({ message: 'Recipe state cleared successfully' });
  } catch (error) {
    // TODO add general error message, specific is for debugging only 
    return NextResponse.json({ error: error.message }, { status: 500});
  } finally {
    await prisma.$disconnect();
  }
}
