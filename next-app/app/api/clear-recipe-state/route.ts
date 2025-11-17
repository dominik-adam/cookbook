import { getServerSession } from "next-auth/next"
import { prisma } from "@/utils/prisma";
import { options } from 'app/api/auth/[...nextauth]/options'
import { NextResponse } from "next/server";
import { getCanonicalEmail } from '@/utils/auth';
import { ClearRecipeStateSchema, validateData } from '@/lib/validations';

export async function POST(req: Request) {
  const session = await getServerSession(options)

  try {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401});
    }

    const body = await req.json();

    // Validate input
    const validation = validateData(ClearRecipeStateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { recipeId, clearState } = validation.data;

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: getCanonicalEmail(session.user.email),
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
  }
}
