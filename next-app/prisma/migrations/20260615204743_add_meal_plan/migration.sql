-- CreateTable
CREATE TABLE "MealPlanItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeSlug" TEXT NOT NULL,
    "portions" INTEGER NOT NULL DEFAULT 1,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MealPlanItem_userId_recipeSlug_key" ON "MealPlanItem"("userId", "recipeSlug");

-- AddForeignKey
ALTER TABLE "MealPlanItem" ADD CONSTRAINT "MealPlanItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanItem" ADD CONSTRAINT "MealPlanItem_recipeSlug_fkey" FOREIGN KEY ("recipeSlug") REFERENCES "Recipe"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
