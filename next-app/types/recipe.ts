export type IngredientUnit = {
  id: string;
  name: string;
  plural: string;
};

export type Ingredient = {
  id: string;
  name: string;
  image: string;
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
  ingredients?: RecipeIngredient[];
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
};

export type RecipesProps = {
  initRecipes?: Recipe[];
  category: string;
};