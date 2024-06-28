import { PrismaClient } from '@prisma/client';
import { NextResponse } from "next/server";

export async function GET(req) {
  const prisma = new PrismaClient();

  try {
    const searchParams = req.nextUrl.searchParams
    const s = searchParams.get('s')

    const units = await prisma.measurementUnit.findMany();

    return NextResponse.json({ units });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500});
  } finally {
    await prisma.$disconnect();
  }
}
