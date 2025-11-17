import { getServerSession } from "next-auth/next"
import { prisma } from "@/utils/prisma";
import { options } from 'app/api/auth/[...nextauth]/options'
import { NextResponse } from "next/server";
import { getCanonicalEmail } from '@/utils/auth';
import { UpdateBagIngredientSchema, validateData } from '@/lib/validations';

export async function POST(req: Request) {
  const session = await getServerSession(options)

  try {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401});
    }

    const body = await req.json();

    // Validate input
    const validation = validateData(UpdateBagIngredientSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { ingredientId, unitId, amount, note } = validation.data;

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
    // TODO add general error message, specific is for debugging only 
    return NextResponse.json({ error: error.message }, { status: 500});
  }
}
