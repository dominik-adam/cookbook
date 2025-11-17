import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options } from "app/api/auth/[...nextauth]/options";
import { isAdmin } from "@/utils/auth";
import { prisma } from "@/utils/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(options);

  try {
    const searchParams = new URL(req.url).searchParams;
    const s = searchParams.get("s") || "";
    const category = searchParams.get("c") || undefined;

    const recipes = await prisma.recipe.findMany({
      where: {
        title: {
          contains: s,
          mode: "insensitive",
        },
        categoryId: category,
      },
      orderBy: {
        title: "asc",
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
            unit: true,
          },
        },
      },
    });

    if (session && isAdmin(session.user.email)) {
      const addNew = {
        slug: "add-new",
        title: "Add new recipe",
        thumbnail: "/images/add-new.jpg",
        ingredients: [],
      };
      recipes.unshift(addNew as any);
    }

    return NextResponse.json({ recipes });
  } catch (error: any) {
    console.error("Error in get-recipes route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
