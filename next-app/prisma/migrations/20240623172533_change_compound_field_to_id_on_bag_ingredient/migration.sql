-- DropIndex
DROP INDEX "BagIngredient_userId_ingredientId_unitId_key";

-- AlterTable
ALTER TABLE "BagIngredient" ADD CONSTRAINT "BagIngredient_pkey" PRIMARY KEY ("userId", "ingredientId", "unitId");
