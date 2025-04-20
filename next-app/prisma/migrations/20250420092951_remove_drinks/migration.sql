/*
  Warnings:

  - You are about to drop the `Drink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DrinkIngredient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DrinkIngredientState` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DrinkToTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DrinkIngredient" DROP CONSTRAINT "DrinkIngredient_drinkId_fkey";

-- DropForeignKey
ALTER TABLE "DrinkIngredient" DROP CONSTRAINT "DrinkIngredient_ingredientId_fkey";

-- DropForeignKey
ALTER TABLE "DrinkIngredient" DROP CONSTRAINT "DrinkIngredient_unitId_fkey";

-- DropForeignKey
ALTER TABLE "DrinkIngredientState" DROP CONSTRAINT "DrinkIngredientState_drinkId_fkey";

-- DropForeignKey
ALTER TABLE "DrinkIngredientState" DROP CONSTRAINT "DrinkIngredientState_userId_fkey";

-- DropForeignKey
ALTER TABLE "_DrinkToTag" DROP CONSTRAINT "_DrinkToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_DrinkToTag" DROP CONSTRAINT "_DrinkToTag_B_fkey";

-- DropTable
DROP TABLE "Drink";

-- DropTable
DROP TABLE "DrinkIngredient";

-- DropTable
DROP TABLE "DrinkIngredientState";

-- DropTable
DROP TABLE "_DrinkToTag";
