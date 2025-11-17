import { prisma } from "@/utils/prisma";
const RecipeCategory = require('../enum/recipeCategory');


async function main() {
  await prisma.recipeCategory.upsert({
    where: { id: RecipeCategory.DRINK },
    update: {},
    create: {
      id: RecipeCategory.DRINK,
      name: 'Drink',
    },
  });

  await prisma.recipeCategory.upsert({
    where: { id: RecipeCategory.FOOD },
    update: {},
    create: {
      id: RecipeCategory.FOOD,
      name: 'Food',
    },
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
