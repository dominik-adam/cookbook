-- Drop old workout tables
DROP TABLE IF EXISTS "WorkoutExercise";
DROP TABLE IF EXISTS "WorkoutSession";

-- CreateTable DailyPlanSettings
CREATE TABLE "DailyPlanSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "waterTargetL" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "creatineTargetG" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "calorieTarget" INTEGER NOT NULL DEFAULT 2500,
    "sprintCount" INTEGER NOT NULL DEFAULT 8,
    "sprintFrequencyDays" INTEGER NOT NULL DEFAULT 2,
    "pullupWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "pullupSets" INTEGER NOT NULL DEFAULT 4,
    "pullupRepsPerSet" INTEGER NOT NULL DEFAULT 6,
    "pullupFrequencyDays" INTEGER NOT NULL DEFAULT 3,
    "dipWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "dipSets" INTEGER NOT NULL DEFAULT 4,
    "dipRepsPerSet" INTEGER NOT NULL DEFAULT 8,
    "dipFrequencyDays" INTEGER NOT NULL DEFAULT 3,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyPlanSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable DailyLog
CREATE TABLE "DailyLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "waterConsumedL" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waterTargetL" DOUBLE PRECISION NOT NULL,
    "creatineDone" BOOLEAN NOT NULL DEFAULT false,
    "creatineTargetG" DOUBLE PRECISION NOT NULL,
    "calorieTarget" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DailyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable CalorieEntry
CREATE TABLE "CalorieEntry" (
    "id" TEXT NOT NULL,
    "dailyLogId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalorieEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable ExerciseSchedule
CREATE TABLE "ExerciseSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseType" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExerciseSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable ExerciseLog
CREATE TABLE "ExerciseLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "exerciseType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sprintsDone" INTEGER,
    "sprintsPlanned" INTEGER,
    "setResults" JSONB,
    "weightKgUsed" DOUBLE PRECISION,
    "weightKgPlanned" DOUBLE PRECISION,
    "setsPlanned" INTEGER,
    "repsPerSetPlanned" INTEGER,
    "notes" TEXT,
    "fullyCompleted" BOOLEAN NOT NULL DEFAULT false,
    "progressionApplied" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExerciseLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyPlanSettings_userId_key" ON "DailyPlanSettings"("userId");
CREATE UNIQUE INDEX "DailyLog_userId_date_key" ON "DailyLog"("userId", "date");
CREATE UNIQUE INDEX "ExerciseSchedule_userId_exerciseType_scheduledDate_key" ON "ExerciseSchedule"("userId", "exerciseType", "scheduledDate");
CREATE UNIQUE INDEX "ExerciseLog_scheduleId_key" ON "ExerciseLog"("scheduleId");

-- AddForeignKey
ALTER TABLE "DailyPlanSettings" ADD CONSTRAINT "DailyPlanSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyLog" ADD CONSTRAINT "DailyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalorieEntry" ADD CONSTRAINT "CalorieEntry_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "DailyLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExerciseSchedule" ADD CONSTRAINT "ExerciseSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExerciseLog" ADD CONSTRAINT "ExerciseLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExerciseLog" ADD CONSTRAINT "ExerciseLog_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ExerciseSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
