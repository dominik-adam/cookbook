const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.recipeCategory.upsert({
    where: { id: 'drink' },
    update: {},
    create: {
      id: 'drink',
      name: 'Drink',
    },
  });

  await prisma.recipeCategory.upsert({
    where: { id: 'food' },
    update: {},
    create: {
      id: 'food',
      name: 'Food',
    },
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
