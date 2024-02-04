import { PrismaClient } from '@prisma/client';
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const searchParams = req.nextUrl.searchParams
    const s = searchParams.get('s')

    const prisma = new PrismaClient();
    const units = await prisma.measurementUnit.findMany();

    return NextResponse.json({ units });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500});
  }
}
