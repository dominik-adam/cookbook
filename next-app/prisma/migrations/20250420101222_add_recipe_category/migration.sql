-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "categoryId" TEXT NOT NULL DEFAULT 'food';

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RecipeCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
