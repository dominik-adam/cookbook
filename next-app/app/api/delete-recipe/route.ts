import { prisma } from "@/utils/prisma";
import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { NextRequest, NextResponse } from "next/server";
import { handleApiError, AuthenticationError } from '@/lib/errorHandler';
import { isAdmin } from '@/utils/auth';

export async function DELETE(req: NextRequest) {
  let recipeId;

  try {
    const session = await getServerSession(options);

    if (!session || !session.user?.email || !isAdmin(session.user.email)) {
      throw new AuthenticationError('Admin access required');
    }

    const searchParams = req.nextUrl.searchParams;
    recipeId = searchParams.get('recipeId');

    if (!recipeId) {
      return NextResponse.json({ error: 'recipeId is required' }, { status: 400 });
    }


    await prisma.recipe.delete({
      where: {
        id: recipeId!
      }
    });

    return NextResponse.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    return handleApiError(error, {
      route: '/api/delete-recipe',
      recipeId,
    });
  }
}
