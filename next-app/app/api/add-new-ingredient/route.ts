import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { NextResponse } from "next/server";
import { isAdmin } from '@/utils/auth.js';
import { prisma } from "@/utils/prisma";
import { CreateIngredientSchema, validateData } from '@/lib/validations';
import { handleApiError, AuthenticationError } from '@/lib/errorHandler';

export async function POST(req: Request) {
  let name;

  try {
    const session = await getServerSession(options)

    if (!session || !session.user?.email || !isAdmin(session.user.email)) {
      throw new AuthenticationError('Admin access required');
    }

    const body = await req.json();

    // Validate input
    const validation = validateData(CreateIngredientSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name: ingredientName, image } = validation.data;
    name = ingredientName;

    const ingredient = await prisma.ingredient.create({
      data: {
        name: name,
        image: image,
      },
    })

    return NextResponse.json({
      message: 'Ingredient created successfully',
      ingredient: ingredient
    });
  } catch (error) {
    return handleApiError(error, {
      route: '/api/add-new-ingredient',
      ingredientName: name,
    });
  }
}
