-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licensePlate" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "image" TEXT,
    "pzpExpiry" TIMESTAMP(3),
    "pzpLink" TEXT,
    "havarijExpiry" TIMESTAMP(3),
    "havarijLink" TEXT,
    "stkExpiry" TIMESTAMP(3),
    "stkLink" TEXT,
    "ekExpiry" TIMESTAMP(3),
    "ekLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HighwayPass" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "expiry" TIMESTAMP(3),
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HighwayPass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Car_userId_key" ON "Car"("userId");

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HighwayPass" ADD CONSTRAINT "HighwayPass_carId_fkey"
    FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
