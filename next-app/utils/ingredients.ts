import fs from 'fs';
import path from 'path';

/**
 * Type for the ingredient images mapping
 */
type IngredientImagesMap = Record<string, string> & {
  default: string;
};

/**
 * Get all ingredient images from the public/ingredients directory.
 * Returns a map of ingredient names (lowercase) to their image paths.
 */
export function getIngredientImages(): IngredientImagesMap {
  const ingredientDirectory = path.join(process.cwd(), 'public/ingredients');
  const fileNames = fs.readdirSync(ingredientDirectory);

  return fileNames.reduce((obj, fileName) => {
    const key = fileName
      .replace(/\.webp$/, '')
      .replace(/\.png$/, '')
      .replace(/\.jpg$/, '')
      .replace(/\.jpeg$/, '')
      .replace('_', ' ')
      .toLowerCase();
    obj[key] = '/ingredients/' + fileName;
    return obj;
  }, { default: '/ingredients/default.jpg' } as IngredientImagesMap);
}

/**
 * Type for recipe state update payload
 */
type RecipeStateUpdate = {
  recipeId: string;
  slider?: number;
  ingredient?: {
    index: number;
    newState: string;
  };
};

/**
 * Update recipe state (servings slider or ingredient checkboxes)
 */
export async function updateRecipeState(updatedState: RecipeStateUpdate): Promise<Response> {
  const response = await fetch('/api/update-recipe-state', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedState),
  });
  return response;
}

/**
 * Type for recipe state clear payload
 */
type RecipeStateClear = {
  recipeId: string;
  clearState: string;
};

/**
 * Clear recipe state (reset ingredient checkboxes)
 */
export async function clearRecipeState(clearedState: RecipeStateClear): Promise<Response> {
  const response = await fetch('/api/clear-recipe-state', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(clearedState),
  });
  return response;
}

/**
 * Get all bag ingredients for the current user
 */
export async function getBagIngredients(): Promise<Response> {
  const response = await fetch('/api/get-bag');
  return response;
}

/**
 * Type for adding a single ingredient to the bag
 */
type AddToBagPayload = {
  ingredientId: string;
  unitId: string;
  amount?: number | null;
  note?: string;
};

/**
 * Add a single ingredient to the shopping bag
 */
export async function addIngredientToBag(ingredient: AddToBagPayload): Promise<Response> {
  const response = await fetch('/api/add-to-bag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ingredient),
  });
  return response;
}

/**
 * Type for adding multiple ingredients to the bag
 */
type AddToBagManyPayload = {
  ingredients: Array<{
    ingredientId: string;
    unitId: string;
    amount?: number | null;
  }>;
  multiplier: number;
};

/**
 * Add multiple ingredients to the shopping bag at once
 */
export async function addIngredientsToBag(ingredients: AddToBagManyPayload): Promise<Response> {
  const response = await fetch('/api/add-to-bag-many', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ingredients),
  });
  return response;
}

/**
 * Type for updating a bag ingredient
 */
type UpdateBagIngredientPayload = {
  ingredientId: string;
  unitId: string;
  amount?: number | null;
  note?: string;
};

/**
 * Update an existing bag ingredient (amount or note)
 */
export async function updateBagIngredient(ingredient: UpdateBagIngredientPayload): Promise<Response> {
  const response = await fetch('/api/update-bag-ingredient', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ingredient),
  });
  return response;
}

/**
 * Remove an ingredient from the shopping bag
 */
export async function removeBagIngredient(ingredientId: string, unitId: string): Promise<Response> {
  const response = await fetch('/api/remove-from-bag?ingredientId=' + ingredientId + '&unitId=' + unitId, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  return response;
}
