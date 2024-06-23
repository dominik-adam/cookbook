/*
  Warnings:

  - The primary key for the `BagIngredient` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `BagIngredient` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,ingredientId,unitId]` on the table `BagIngredient` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BagIngredient" DROP CONSTRAINT "BagIngredient_pkey",
DROP COLUMN "id";

-- CreateIndex
CREATE UNIQUE INDEX "BagIngredient_userId_ingredientId_unitId_key" ON "BagIngredient"("userId", "ingredientId", "unitId");
