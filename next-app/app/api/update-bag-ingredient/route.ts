import { getServerSession } from "next-auth/next"
import { prisma } from "@/utils/prisma";
import { options } from 'app/api/auth/[...nextauth]/options'
import { NextResponse } from "next/server";
import { getCanonicalEmail } from '@/utils/auth';
import { UpdateBagIngredientSchema, validateData } from '@/lib/validations';
import { handleApiError, AuthenticationError } from '@/lib/errorHandler';

export async function POST(req: Request) {
  let ingredientId;
  let unitId;

  try {
    const session = await getServerSession(options)

    if (!session) {
      throw new AuthenticationError();
    }

    const body = await req.json();

    // Validate input
    const validation = validateData(UpdateBagIngredientSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { ingredientId: ingId, unitId: uId, amount, note } = validation.data;
    ingredientId = ingId;
    unitId = uId;

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: getCanonicalEmail(session.user!.email!),
      },
    });

    const bagIngredient = await prisma.bagIngredient.update({
      where: {
        bagIngredientId: {
          userId: user.id,
          ingredientId: ingredientId,
          unitId: unitId
        },
      },
      data: {
        amount: amount,
        note: note,
      }
    });

    return NextResponse.json({ message: 'Bag item updated successfully' });
  } catch (error) {
    return handleApiError(error, {
      route: '/api/update-bag-ingredient',
      ingredientId,
      unitId,
    });
  }
}
