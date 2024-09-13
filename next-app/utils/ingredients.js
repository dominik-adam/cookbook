import fs from 'fs';
import path from 'path';

export function getIngredientImages() {
    const ingredientDirectory = path.join(process.cwd(), 'public/ingredients');
    const fileNames = fs.readdirSync(ingredientDirectory);

    return fileNames.reduce((obj, fileName) => {
        const key = fileName
            .replace(/\.webp$/, '')
            .replace(/\.png$/, '')
            .replace(/\.jpg$/, '')
            .replace(/\.jpeg$/, '')
            .replace('_', ' ')
            .toLowerCase()
        obj[key] = '/ingredients/' + fileName;
        return obj;
    }, {default: '/ingredients/default.jpg'});
}

export async function updateRecipeState(updatedState) {
  const response = await fetch('/api/update-recipe-state', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedState),
  });
  return response;
};

export async function clearRecipeState(clearedState) {
  const response = await fetch('/api/clear-recipe-state', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(clearedState),
  });
  return response;
};

export async function getBagIngredients() {
  const response = await fetch('/api/get-bag');
  return response;
}

export async function addIngredientToBag(ingredient) {
  const response = await fetch('/api/add-to-bag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ingredient),
  });
  return response;
};

export async function addIngredientsToBag(ingredients) {
  const response = await fetch('/api/add-to-bag-many', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ingredients),
  });
  return response;
};

export async function updateBagIngredient(ingredient) {
  const response = await fetch('/api/update-bag-ingredient', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ingredient),
  });
  return response;
};

export async function removeBagIngredient(ingredientId, unitId) {
  const response = await fetch('/api/remove-from-bag?ingredientId=' + ingredientId + '&unitId=' + unitId, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  return response;
};