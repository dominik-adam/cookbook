/*
  Warnings:

  - You are about to drop the column `instruction` on the `BagIngredient` table. All the data in the column will be lost.
  - You are about to drop the column `shoppingBagId` on the `BagIngredient` table. All the data in the column will be lost.
  - You are about to drop the `ShoppingBag` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `BagIngredient` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `BagIngredient` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BagIngredient" DROP CONSTRAINT "BagIngredient_shoppingBagId_fkey";

-- DropForeignKey
ALTER TABLE "ShoppingBag" DROP CONSTRAINT "ShoppingBag_userId_fkey";

-- AlterTable
ALTER TABLE "BagIngredient" DROP COLUMN "instruction",
DROP COLUMN "shoppingBagId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "ShoppingBag";

-- CreateIndex
CREATE UNIQUE INDEX "BagIngredient_userId_key" ON "BagIngredient"("userId");

-- AddForeignKey
ALTER TABLE "BagIngredient" ADD CONSTRAINT "BagIngredient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
