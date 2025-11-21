/**
 * Nutrition calculation utilities
 *
 * Functions to calculate caloric and nutritional values for recipes,
 * ingredients, and aggregated ingredient lists.
 */

import { convertToGrams, isConvertibleUnit } from '@/lib/unitConversions';
import type { Ingredient, RecipeIngredient, Recipe, AggregatedIngredient } from '@/types/recipe';

/**
 * Nutritional information structure
 */
export type NutritionInfo = {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

/**
 * Calculate nutritional values for a single recipe ingredient
 *
 * @param ingredient - The ingredient with nutritional data per 100g
 * @param amount - The quantity of the ingredient
 * @param unitName - The unit of measurement
 * @returns Nutritional information for this specific amount, or null values if calculation not possible
 */
export function calculateIngredientNutrition(
  ingredient: Ingredient,
  amount: number | null,
  unitName: string
): NutritionInfo {
  // Return null values if we don't have the required data
  if (
    !amount ||
    amount <= 0 ||
    !ingredient.caloriesPer100g ||
    !isConvertibleUnit(unitName)
  ) {
    return {
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
    };
  }

  const totalGrams = convertToGrams(amount, unitName);

  if (totalGrams === null) {
    return {
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
    };
  }

  // Calculate nutritional values based on grams
  const multiplier = totalGrams / 100;

  return {
    calories: ingredient.caloriesPer100g ? Math.round(ingredient.caloriesPer100g * multiplier) : null,
    protein: ingredient.proteinPer100g ? Math.round(ingredient.proteinPer100g * multiplier * 10) / 10 : null,
    carbs: ingredient.carbsPer100g ? Math.round(ingredient.carbsPer100g * multiplier * 10) / 10 : null,
    fat: ingredient.fatPer100g ? Math.round(ingredient.fatPer100g * multiplier * 10) / 10 : null,
  };
}

/**
 * Calculate total nutritional values for a recipe
 *
 * @param recipeIngredients - Array of recipe ingredients with their amounts and units
 * @returns Total and per-serving nutritional information
 */
export function calculateRecipeNutrition(
  recipeIngredients: RecipeIngredient[],
  servings: number
): {
  total: NutritionInfo;
  perServing: NutritionInfo;
  hasCompleteData: boolean;
} {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let hasCompleteData = true;
  let hasAnyData = false;

  for (const recipeIngredient of recipeIngredients) {
    const nutrition = calculateIngredientNutrition(
      recipeIngredient.ingredient,
      recipeIngredient.amount,
      recipeIngredient.unit.name
    );

    // If any ingredient can't be calculated, mark as incomplete
    if (nutrition.calories === null) {
      hasCompleteData = false;
    } else {
      hasAnyData = true;
      totalCalories += nutrition.calories;
      totalProtein += nutrition.protein || 0;
      totalCarbs += nutrition.carbs || 0;
      totalFat += nutrition.fat || 0;
    }
  }

  // If we have no data at all, return null values
  if (!hasAnyData) {
    return {
      total: {
        calories: null,
        protein: null,
        carbs: null,
        fat: null,
      },
      perServing: {
        calories: null,
        protein: null,
        carbs: null,
        fat: null,
      },
      hasCompleteData: false,
    };
  }

  // Calculate per serving values
  const caloriesPerServing = servings > 0 ? Math.round(totalCalories / servings) : null;
  const proteinPerServing = servings > 0 ? Math.round((totalProtein / servings) * 10) / 10 : null;
  const carbsPerServing = servings > 0 ? Math.round((totalCarbs / servings) * 10) / 10 : null;
  const fatPerServing = servings > 0 ? Math.round((totalFat / servings) * 10) / 10 : null;

  return {
    total: {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
    },
    perServing: {
      calories: caloriesPerServing,
      protein: proteinPerServing,
      carbs: carbsPerServing,
      fat: fatPerServing,
    },
    hasCompleteData,
  };
}

/**
 * Calculate nutritional values for an aggregated ingredient (from multiple recipes)
 *
 * @param aggregatedIngredient - The aggregated ingredient with multiple amounts
 * @param ingredient - The ingredient with nutritional data
 * @returns Total nutritional information for all amounts combined
 */
export function calculateAggregatedNutrition(
  aggregatedIngredient: AggregatedIngredient,
  ingredient: Ingredient
): NutritionInfo {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let hasAnyData = false;

  for (const amountEntry of aggregatedIngredient.amounts) {
    const nutrition = calculateIngredientNutrition(
      ingredient,
      amountEntry.amount,
      amountEntry.unit
    );

    if (nutrition.calories !== null) {
      hasAnyData = true;
      totalCalories += nutrition.calories;
      totalProtein += nutrition.protein || 0;
      totalCarbs += nutrition.carbs || 0;
      totalFat += nutrition.fat || 0;
    }
  }

  if (!hasAnyData) {
    return {
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
    };
  }

  return {
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein * 10) / 10,
    carbs: Math.round(totalCarbs * 10) / 10,
    fat: Math.round(totalFat * 10) / 10,
  };
}

/**
 * Format calorie value for display
 *
 * @param calories - The calorie value to format
 * @returns Formatted string (e.g., "250 cal") or "N/A" if null
 */
export function formatCalories(calories: number | null): string {
  return calories !== null ? `${calories} cal` : 'N/A';
}

/**
 * Format macronutrient value for display
 *
 * @param value - The macro value to format
 * @param unit - The unit (default: "g")
 * @returns Formatted string (e.g., "15.5g") or "N/A" if null
 */
export function formatMacro(value: number | null, unit: string = 'g'): string {
  return value !== null ? `${value}${unit}` : 'N/A';
}
