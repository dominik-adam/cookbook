-- CreateTable
CREATE TABLE "BagIngredient" (
    "userId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "note" TEXT,

    CONSTRAINT "BagIngredient_pkey" PRIMARY KEY ("userId","ingredientId","unitId")
);

-- AddForeignKey
ALTER TABLE "BagIngredient" ADD CONSTRAINT "BagIngredient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BagIngredient" ADD CONSTRAINT "BagIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BagIngredient" ADD CONSTRAINT "BagIngredient_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "MeasurementUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
