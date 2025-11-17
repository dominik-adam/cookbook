import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { prisma } from "@/utils/prisma";
import { NextResponse } from "next/server";
import { getCanonicalEmail } from '@/utils/auth';
import { AddToBagManySchema, validateData } from '@/lib/validations';
import { handleApiError, AuthenticationError } from '@/lib/errorHandler';

export async function POST(req: Request) {
  let ingredients;
  let multiplier;

  try {
    const session = await getServerSession(options);

    if (!session) {
      throw new AuthenticationError();
    }

    const body = await req.json();

    // Validate input
    const validation = validateData(AddToBagManySchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    ({ ingredients, multiplier } = validation.data);


    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: getCanonicalEmail(session.user!.email!),
      },
    });

    const maxOrder = await prisma.bagIngredient.aggregate({
      where: {
        userId: user.id,
      },
      _max: {
        order: true,
      },
    });
    let baseOrder = maxOrder._max.order || 0;

    for (const ingredient of ingredients) {
      const bagIngredient = await prisma.bagIngredient.findUnique({
        where: {
          bagIngredientId: {
            userId: user.id,
            ingredientId: ingredient.ingredientId,
            unitId: ingredient.unitId
          },
        },
      });
  
      if (bagIngredient) {
        const bagIngredientUpdateData = {}
        if (ingredient.amount) {
          if (bagIngredient.amount) {
            bagIngredientUpdateData["amount"] = bagIngredient.amount + parseFloat(ingredient.amount) * parseFloat(multiplier);
          } else {
            bagIngredientUpdateData["amount"] = parseFloat(ingredient.amount) * parseFloat(multiplier);
          }
    
          await prisma.bagIngredient.update({
            where: {
              bagIngredientId: {
                userId: user.id,
                ingredientId: ingredient.ingredientId,
                unitId: ingredient.unitId
              }
            },
            data: bagIngredientUpdateData,
          })
        }
      } else {
        const bagIngredientCreateData = {
          userId: user.id,
          ingredientId: ingredient.ingredientId,
          unitId: ingredient.unitId,
          order: ++baseOrder
        }
        if (ingredient.amount) {
          bagIngredientCreateData["amount"] = parseFloat(ingredient.amount) * parseFloat(multiplier)
        }
  
        await prisma.bagIngredient.create({
          data: bagIngredientCreateData,
        })
      }
    }


    return NextResponse.json({
      message: 'Ingredients were successfully added to the bag'
    });
  } catch (error) {
    return handleApiError(error, {
      route: '/api/add-to-bag-many',
      ingredientCount: ingredients?.length,
      multiplier,
    });
  }
}
