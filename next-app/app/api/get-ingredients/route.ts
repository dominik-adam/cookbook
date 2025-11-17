import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {

  try {
    const searchParams = req.nextUrl.searchParams
    const s = searchParams.get('s')

    const ingredients = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: s ?? undefined,
          mode: 'insensitive'
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ ingredients });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500});
  }
}
