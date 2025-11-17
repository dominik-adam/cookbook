const { PrismaClient } = require('@prisma/client');
const RecipeCategory = require('../enum/recipeCategory');

const prisma = new PrismaClient();


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
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
