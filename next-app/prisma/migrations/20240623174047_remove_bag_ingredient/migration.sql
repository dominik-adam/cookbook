/*
  Warnings:

  - You are about to drop the `BagIngredient` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BagIngredient" DROP CONSTRAINT "BagIngredient_ingredientId_fkey";

-- DropForeignKey
ALTER TABLE "BagIngredient" DROP CONSTRAINT "BagIngredient_unitId_fkey";

-- DropForeignKey
ALTER TABLE "BagIngredient" DROP CONSTRAINT "BagIngredient_userId_fkey";

-- DropTable
DROP TABLE "BagIngredient";
