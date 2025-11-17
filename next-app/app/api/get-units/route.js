import { prisma } from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const searchParams = req.nextUrl.searchParams
    const s = searchParams.get('s')

    const units = await prisma.measurementUnit.findMany();

    return NextResponse.json({ units });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500});
  }
}
