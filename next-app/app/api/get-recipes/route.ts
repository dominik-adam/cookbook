import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options } from "app/api/auth/[...nextauth]/options";
import { isAdmin } from "@/utils/auth";
import { prisma } from "@/utils/prisma";
import { handleApiError } from '@/lib/errorHandler';
import { calculateRecipeNutrition, calculateIngredientNutrition } from '@/utils/nutritionCalculations';

export async function GET(req: Request) {
  const session = await getServerSession(options);

  try {
    const searchParams = new URL(req.url).searchParams;
    const s = searchParams.get("s") || "";
    const category = searchParams.get("c");
    const tagsParam = searchParams.get("tags");
    const tags = tagsParam ? tagsParam.split(",").filter(t => t.trim()) : [];

    const recipes = await prisma.recipe.findMany({
      where: {
        title: {
          contains: s,
          mode: "insensitive",
        },
        ...(category && { categoryId: category }),
        ...(tags.length > 0 && {
          tags: {
            some: {
              name: {
                in: tags
              }
            }
          }
        }),
      },
      orderBy: {
        title: "asc",
      },
      include: {
        tags: true,
        ingredients: {
          include: {
            ingredient: true,
            unit: true,
          },
        },
      },
    });

    // Calculate nutrition for each recipe
    const recipesWithNutrition = recipes.map(recipe => {
      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        return recipe;
      }

      // Calculate nutrition for each ingredient
      const ingredientsWithNutrition = recipe.ingredients.map(recipeIngredient => {
        const nutrition = calculateIngredientNutrition(
          recipeIngredient.ingredient,
          recipeIngredient.amount,
          recipeIngredient.unit.name
        );

        return {
          ...recipeIngredient,
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
        };
      });

      // Calculate total recipe nutrition
      const recipeNutrition = calculateRecipeNutrition(recipe.ingredients, recipe.serves);

      return {
        ...recipe,
        ingredients: ingredientsWithNutrition,
        totalCalories: recipeNutrition.total.calories,
        caloriesPerServing: recipeNutrition.perServing.calories,
        totalProtein: recipeNutrition.total.protein,
        proteinPerServing: recipeNutrition.perServing.protein,
        totalCarbs: recipeNutrition.total.carbs,
        carbsPerServing: recipeNutrition.perServing.carbs,
        totalFat: recipeNutrition.total.fat,
        fatPerServing: recipeNutrition.perServing.fat,
        hasCompleteNutritionData: recipeNutrition.hasCompleteData,
      };
    });

    if (session && session.user?.email && isAdmin(session.user.email)) {
      const addNew = {
        slug: `add-new?c=${category}`,
        title: "Add new recipe",
        thumbnail: "/images/add-new.jpg",
        ingredients: [],
      };
      recipesWithNutrition.unshift(addNew as any);
    }

    return NextResponse.json({ recipes: recipesWithNutrition });
  } catch (error: any) {
    return handleApiError(error, {
      route: '/api/get-recipes',
    });
  }
}
