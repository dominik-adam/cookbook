import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from '@/lib/errorHandler';

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
    return handleApiError(error, {
      route: '/api/get-ingredients',
    });
  }
}
