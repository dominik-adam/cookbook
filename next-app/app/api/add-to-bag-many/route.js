import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { PrismaClient } from '@prisma/client';
import { NextResponse } from "next/server";

export async function POST(req) {
  const session = await getServerSession(options);
  const prisma = new PrismaClient();

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
          unitId: ingredient.unitId
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
  } finally {
    await prisma.$disconnect();
  }
}
