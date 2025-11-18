import { Recipe, AggregatedIngredient } from '@/types/recipe';

export function aggregateIngredients(recipes: Recipe[]): AggregatedIngredient[] {
  const aggregateMap = new Map<string, AggregatedIngredient>();

  for (const recipe of recipes) {
    const ingredients = recipe.ingredients ?? [];
    for (const ing of ingredients) {
      const key = ing.ingredientId;
      const existing = aggregateMap.get(key);

      if (existing) {
        // Check if this unit already exists for this ingredient
        const existingAmount = existing.amounts.find(a => a.unit === ing.unit.name && a.unitPlural === ing.unit.plural);

        if (existingAmount) {
          // Add to existing amount for this unit
          if (typeof ing.amount === "number") {
            existingAmount.amount = (existingAmount.amount ?? 0) + ing.amount;
          }
        } else {
          // Add new unit entry
          existing.amounts.push({
            amount: ing.amount ?? 0,
            unit: ing.unit.name,
            unitPlural: ing.unit.plural,
          });
        }
      } else {
        aggregateMap.set(key, {
          ingredientId: ing.ingredientId,
          name: ing.ingredient.name,
          image: ing.ingredient.image,
          amounts: [{
            amount: ing.amount ?? 0,
            unit: ing.unit.name,
            unitPlural: ing.unit.plural,
          }],
        });
      }
    }
  }

  return Array.from(aggregateMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
