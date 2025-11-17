import { getServerSession } from "next-auth/next"
import { prisma } from "@/utils/prisma";
import { options } from 'app/api/auth/[...nextauth]/options'
import { NextResponse } from "next/server";
import { getCanonicalEmail } from '@/utils/auth';
import { UpdateRecipeStateSchema, validateData } from '@/lib/validations';
import { handleApiError, AuthenticationError } from '@/lib/errorHandler';

export async function POST(req: Request) {
  let recipeId;

  try {
    const session = await getServerSession(options)

    if (!session) {
      throw new AuthenticationError();
    }

    const body = await req.json();

    // Validate input
    const validation = validateData(UpdateRecipeStateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { recipeId: rId, slider, ingredient } = validation.data;
    recipeId = rId;

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: getCanonicalEmail(session.user!.email!),
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
    return handleApiError(error, {
      route: '/api/update-recipe-state',
      recipeId,
    });
  }
}
