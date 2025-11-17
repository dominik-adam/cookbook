import { prisma } from "@/utils/prisma";
import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { NextRequest, NextResponse } from "next/server";
import { getCanonicalEmail } from '@/utils/auth';
import { RemoveFromBagSchema, validateData } from '@/lib/validations';

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(options);

  try {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401});
    }

    const searchParams = req.nextUrl.searchParams;
    const params = {
      ingredientId: searchParams.get('ingredientId'),
      unitId: searchParams.get('unitId'),
    };

    // Validate query parameters
    const validation = validateData(RemoveFromBagSchema, params);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { ingredientId, unitId } = validation.data;


    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: getCanonicalEmail(session.user!.email!),
      },
    });

    const entryToDelete = await prisma.bagIngredient.findUnique({
      where: {
        bagIngredientId: {
          userId: user.id,
          ingredientId: ingredientId,
          unitId: unitId
        }
      }
    });

    if (entryToDelete) {
      await prisma.bagIngredient.delete({
        where: {
          bagIngredientId: {
            userId: user.id,
            ingredientId: ingredientId,
            unitId: unitId
          }
        }
      });
  
      await prisma.bagIngredient.updateMany({
        where: {
          userId: user.id,
          order: {
            gt: entryToDelete.order,
          },
        },
        data: {
          order: {
            decrement: 1,
          },
        },
      });
    }

    return NextResponse.json({});
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500});
  }
}
