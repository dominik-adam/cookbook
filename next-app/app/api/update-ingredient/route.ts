import { getServerSession } from "next-auth/next";
import { options } from 'app/api/auth/[...nextauth]/options';
import { NextResponse } from "next/server";
import { isAdmin } from '@/utils/auth';
import { prisma } from "@/utils/prisma";
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/errorHandler';
import { z } from 'zod';

const UpdateIngredientSchema = z.object({
  id: z.string().cuid('Invalid ID format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  image: z.string().min(1, 'Image is required').max(500, 'Image path must be less than 500 characters'),
  caloriesPer100g: z.number().nonnegative('Calories must be non-negative').nullable(),
  proteinPer100g: z.number().nonnegative('Protein must be non-negative').nullable(),
  carbsPer100g: z.number().nonnegative('Carbs must be non-negative').nullable(),
  fatPer100g: z.number().nonnegative('Fat must be non-negative').nullable(),
});

export async function PUT(req: Request) {
  let ingredientName;

  try {
    const session = await getServerSession(options);

    if (!session || !session.user?.email || !isAdmin(session.user.email)) {
      throw new AuthenticationError('Admin access required');
    }

    const body = await req.json();

    // Validate input
    const validation = UpdateIngredientSchema.safeParse(body);
    if (!validation.success) {
      const errorMessages = validation.error.issues.map(err => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      throw new ValidationError(errorMessages.join(', '));
    }

    const {
      id,
      name,
      image,
      caloriesPer100g,
      proteinPer100g,
      carbsPer100g,
      fatPer100g
    } = validation.data;

    ingredientName = name;

    // Check if ingredient exists
    const existingIngredient = await prisma.ingredient.findUnique({
      where: { id },
    });

    if (!existingIngredient) {
      throw new ValidationError('Ingredient not found');
    }

    // Update ingredient
    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        name,
        image,
        caloriesPer100g,
        proteinPer100g,
        carbsPer100g,
        fatPer100g,
      },
    });

    return NextResponse.json({
      message: 'Ingredient updated successfully',
      ingredient: ingredient
    });
  } catch (error) {
    return handleApiError(error, {
      route: '/api/update-ingredient',
      ingredientName,
    });
  }
}
