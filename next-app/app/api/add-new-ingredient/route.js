import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { NextResponse } from "next/server";
import { isAdmin } from '@/utils/auth.js';
import { prisma } from "@/utils/prisma";

export async function POST(req) {
  const session = await getServerSession(options)

  try {
    if (!session || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401});
    }

    const { name, image } = await req.json();
    // TODO add validation

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
