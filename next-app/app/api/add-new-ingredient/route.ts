import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { NextResponse } from "next/server";
import { isAdmin } from '@/utils/auth.js';
import { prisma } from "@/utils/prisma";
import { CreateIngredientSchema, validateData } from '@/lib/validations';

export async function POST(req: Request) {
  const session = await getServerSession(options)

  try {
    if (!session || !session.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401});
    }

    const body = await req.json();

    // Validate input
    const validation = validateData(CreateIngredientSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, image } = validation.data;

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
    // TODO add general error message, specific is for debugging only 
    return NextResponse.json({ error: error.message }, { status: 500});
  }
}
