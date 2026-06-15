import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { NextResponse } from 'next/server';
import { handleApiError, AuthenticationError } from '@/lib/errorHandler';
import { MealPlanUpsertSchema, MealPlanRemoveSchema, validateData } from '@/lib/validations';

export async function GET() {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const items = await prisma.mealPlanItem.findMany({
      where: { userId: user.id },
      include: {
        recipe: {
          include: {
            ingredients: {
              include: {
                ingredient: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: { addedAt: 'asc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    return handleApiError(error, { route: '/api/meal-plan GET' });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const body = await req.json();
    const validation = validateData(MealPlanUpsertSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { recipeSlug, portions } = validation.data;

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    const item = await prisma.mealPlanItem.upsert({
      where: { userId_recipeSlug: { userId: user.id, recipeSlug } },
      create: { userId: user.id, recipeSlug, portions },
      update: { portions },
    });

    return NextResponse.json({ item });
  } catch (error) {
    return handleApiError(error, { route: '/api/meal-plan POST' });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(options);
    if (!session) throw new AuthenticationError();

    const { searchParams } = new URL(req.url);
    const validation = validateData(MealPlanRemoveSchema, { recipeSlug: searchParams.get('recipeSlug') });
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { recipeSlug } = validation.data;

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user!.email! },
    });

    await prisma.mealPlanItem.delete({
      where: { userId_recipeSlug: { userId: user.id, recipeSlug } },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, { route: '/api/meal-plan DELETE' });
  }
}
