import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from '@/lib/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const s = searchParams.get('s')

    const units = await prisma.measurementUnit.findMany();

    return NextResponse.json({ units });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500});
  }
}
