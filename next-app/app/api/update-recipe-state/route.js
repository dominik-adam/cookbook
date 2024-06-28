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

    const { recipeId, slider, ingredient } = await req.json();
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
      const recipeStateUpdateData = {}
      if (slider) {
        recipeStateUpdateData["serves"] = parseInt(slider)
      }
      if (ingredient) {
        if (recipeState.state) {
          const prefix = recipeState.state.substr(0, ingredient.index);
          const flippedChar = recipeState.state[ingredient.index] === "0" ? "1" : "0";
          const suffix = recipeState.state.substr(ingredient.index + 1);
          
          recipeStateUpdateData["state"] = prefix + flippedChar + suffix;
        } else {
          recipeStateUpdateData["state"] = ingredient.newState;
        }
      }

      const updateRecipeState = await prisma.recipeIngredientState.update({
        where: {
          id: {
            recipeId: recipeId,
            userId: user.id,
          }
        },
        data: recipeStateUpdateData,
      })
    } else {
      const recipeStateCreateData = {
        recipeId: recipeId,
        userId: user.id,
      }
      if (slider) {
        recipeStateCreateData["serves"] = parseInt(slider)
      }
      if (ingredient) {
        recipeStateCreateData["state"] = ingredient.newState;
      }

      const createRecipeState = await prisma.recipeIngredientState.create({
        data: recipeStateCreateData,
      })
    }

    return NextResponse.json({ message: 'Recipe state changed successfully' });
  } catch (error) {
    // TODO add general error message, specific is for debugging only 
    return NextResponse.json({ error: error.message }, { status: 500});
  } finally {
    await prisma.$disconnect();
  }
}
