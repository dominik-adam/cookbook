import { PrismaClient } from '@prisma/client';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { isAdmin } from '@/utils/auth.js';

export async function GET(req) {
  const session = await getServerSession(options);
  const prisma = new PrismaClient();

  try {
    const searchParams = req.nextUrl.searchParams
    const s = searchParams.get('s')
    const category = searchParams.get('c')

    const recipes = await prisma.recipe.findMany({
      where: {
        title: {
          contains: s,
          mode: 'insensitive'
        },
        categoryId: category,
      },
      orderBy: {
        title: 'asc'
      }
    });

    if (session && isAdmin(session.user.email)) {
      const addNew = {
        slug: "add-new",
        title: "Add new recipe",
        thumbnail: "/images/add-new.jpg"
      }
      recipes.unshift(addNew)
    }

    return NextResponse.json({ recipes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500});
  } finally {
    await prisma.$disconnect();
  }
}
