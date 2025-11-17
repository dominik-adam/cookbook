import { Recipe, AggregatedIngredient } from '@/types/recipe';

export function aggregateIngredients(recipes: Recipe[]): AggregatedIngredient[] {
  const aggregateMap = new Map<string, AggregatedIngredient>();

  for (const recipe of recipes) {
    const ingredients = recipe.ingredients ?? [];
    for (const ing of ingredients) {
      const key = `${ing.ingredientId}_${ing.unitId}`;
      const existing = aggregateMap.get(key);

      if (existing) {
        if (typeof ing.amount === "number") {
          existing.totalAmount = (existing.totalAmount ?? 0) + ing.amount;
        }
      } else {
        aggregateMap.set(key, {
          ingredientId: ing.ingredientId,
          name: ing.ingredient.name,
          image: ing.ingredient.image,
          totalAmount: ing.amount ?? 0,
          unit: ing.unit.name,
          unitPlural: ing.unit.plural,
        });
      }
    }
  }

  return Array.from(aggregateMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
