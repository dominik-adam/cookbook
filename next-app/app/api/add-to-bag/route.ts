import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { prisma } from "@/utils/prisma";
import { NextResponse } from "next/server";
import { getCanonicalEmail } from '@/utils/auth';
import { AddToBagSchema, validateData } from '@/lib/validations';
import { handleApiError, AuthenticationError } from '@/lib/errorHandler';

export async function POST(req: Request) {
  let ingredientId: string | undefined;
  let unitId: string | undefined;

  try {
    const session = await getServerSession(options);

    if (!session) {
      throw new AuthenticationError();
    }

    const body = await req.json();

    // Validate input
    const validation = validateData(AddToBagSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { ingredientId: ingId, unitId: uId, amount, note } = validation.data;
    ingredientId = ingId!;
    unitId = uId!;


    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: getCanonicalEmail(session.user!.email!),
      },
    });

    const bagIngredient = await prisma.bagIngredient.findUnique({
      where: {
        bagIngredientId: {
          userId: user.id,
          ingredientId: ingId!,
          unitId: uId!
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
            bagIngredientId: {
              userId: user.id,
              ingredientId: ingId!,
              unitId: uId!
            }
          },
          data: bagIngredientUpdateData,
        })
      }
    } else {
      const maxOrder = await prisma.bagIngredient.aggregate({
        where: {
          userId: user.id,
        },
        _max: {
          order: true,
        },
      });

      const bagIngredientCreateData = {
        userId: user.id,
        ingredientId: ingId!,
        unitId: uId!,
        order: (maxOrder._max.order || 0) + 1,
        note: note
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
    return handleApiError(error, {
      route: '/api/add-to-bag',
      ingredientId,
      unitId,
    });
  }
}
