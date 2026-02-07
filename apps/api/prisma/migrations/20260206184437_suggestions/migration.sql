-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PROPUESTA', 'ACEPTADA', 'MODIFICADA');

-- CreateTable
CREATE TABLE "MealSuggestion" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "slot" TEXT NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PROPUESTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealSuggestionRecipe" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "recipeName" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "MealSuggestionRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MealSuggestion_householdId_date_idx" ON "MealSuggestion"("householdId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MealSuggestion_householdId_date_slot_key" ON "MealSuggestion"("householdId", "date", "slot");

-- CreateIndex
CREATE INDEX "MealSuggestionRecipe_suggestionId_idx" ON "MealSuggestionRecipe"("suggestionId");

-- AddForeignKey
ALTER TABLE "MealSuggestion" ADD CONSTRAINT "MealSuggestion_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealSuggestionRecipe" ADD CONSTRAINT "MealSuggestionRecipe_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "MealSuggestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
