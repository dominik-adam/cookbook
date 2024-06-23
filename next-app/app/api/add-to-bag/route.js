import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { PrismaClient } from '@prisma/client';
import { NextResponse } from "next/server";

export async function POST(req) {
  const session = await getServerSession(options);

  try {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401});
    }

    const { 
      ingredientId,
      unitId,
      amount
    } = await req.json();
    // TODO add validation
    
    const prisma = new PrismaClient();

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: session.user.email == "ttodova@gmail.com" ? "adam.dominik@gmail.com" : session.user.email,
      },
    });

    const bagIngredient = await prisma.bagIngredient.findUnique({
      where: {
        id: {
          userId: user.id,
          ingredientId: ingredientId,
          unitId: unitId
        },
      },
    });

    if (bagIngredient) {
      const bagIngredientUpdateData = {}
      if (amount) {
        if (bagIngredient.amount) {
          bagIngredientUpdateData["amount"] = bagIngredient.amount + parseFloat(amount);
        } else {
          bagIngredientUpdateData["amount"] = parseFloat(amount);
        }
  
        await prisma.bagIngredient.update({
          where: {
            id: {
              userId: user.id,
              ingredientId: ingredientId,
              unitId: unitId
            }
          },
          data: bagIngredientUpdateData,
        })
      }
    } else {
      const bagIngredientCreateData = {
        userId: user.id,
        ingredientId: ingredientId,
        unitId: unitId
      }
      if (amount) {
        bagIngredientCreateData["amount"] = parseFloat(amount)
      }

      await prisma.bagIngredient.create({
        data: bagIngredientCreateData,
      })
    }

    return NextResponse.json({ 
      message: 'Ingredient was successfully added to the bag'
    });
  } catch (error) {
    // TODO add general error message, specific is for debugging only 
    return NextResponse.json({ error: error.message }, { status: 500});
  }
}
