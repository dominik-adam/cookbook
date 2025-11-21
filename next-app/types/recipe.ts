export type IngredientUnit = {
  id: string;
  name: string;
  plural: string;
};

export type Ingredient = {
  id: string;
  name: string;
  image: string;
  caloriesPer100g?: number | null;
  proteinPer100g?: number | null;
  carbsPer100g?: number | null;
  fatPer100g?: number | null;
};

export type RecipeIngredient = {
  id: string;
  recipeId: string;
  ingredientId: string;
  unitId: string;
  amount: number | null;
  instruction: string | null;
  ingredient: Ingredient;
  unit: IngredientUnit;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
};

export type Tag = {
  id: string;
  name: string;
};

export type Recipe = {
  id: string;
  categoryId: string;
  slug: string;
  title: string;
  serves: number;
  link?: string;
  instructions?: string;
  thumbnail?: string;
  video?: string;
  tags?: Tag[];
  ingredients?: RecipeIngredient[];
  totalCalories?: number | null;
  caloriesPerServing?: number | null;
  totalProtein?: number | null;
  proteinPerServing?: number | null;
  totalCarbs?: number | null;
  carbsPerServing?: number | null;
  totalFat?: number | null;
  fatPerServing?: number | null;
  hasCompleteNutritionData?: boolean;
};

export type AggregatedIngredient = {
  ingredientId: string;
  name: string;
  image: string;
  amounts: Array<{
    amount: number | null;
    unit: string;
    unitPlural: string;
  }>;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
};

export type RecipesProps = {
  initRecipes?: Recipe[];
  category: string;
};