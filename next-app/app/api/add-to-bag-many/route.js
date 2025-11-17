import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { prisma } from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  const session = await getServerSession(options);

  try {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401});
    }

    const { ingredients, multiplier } = await req.json();
    // TODO add validation
    

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: session.user.email == "ttodova@gmail.com" ? "adam.dominik@gmail.com" : session.user.email,
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
      message: 'Ingredient was successfully added to the bag'
    });
  } catch (error) {
    // TODO add general error message, specific is for debugging only 
    return NextResponse.json({ error: error.message }, { status: 500});
  }
}
