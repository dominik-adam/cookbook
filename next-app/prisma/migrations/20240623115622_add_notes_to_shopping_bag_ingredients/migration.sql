/*
  Warnings:

  - Added the required column `note` to the `BagIngredient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BagIngredient" ADD COLUMN     "note" TEXT NOT NULL;
