/*
  Warnings:

  - A unique constraint covering the columns `[suggestionId,position]` on the table `MealSuggestionRecipe` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[suggestionId,recipeId]` on the table `MealSuggestionRecipe` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `slot` on the `MealSuggestion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MealSlot" AS ENUM ('DESAYUNO', 'COMIDA', 'CENA');

-- AlterTable
ALTER TABLE "MealSuggestion" ADD COLUMN     "acceptedRecipeId" TEXT,
DROP COLUMN "slot",
ADD COLUMN     "slot" "MealSlot" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MealSuggestion_householdId_date_slot_key" ON "MealSuggestion"("householdId", "date", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "MealSuggestionRecipe_suggestionId_position_key" ON "MealSuggestionRecipe"("suggestionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "MealSuggestionRecipe_suggestionId_recipeId_key" ON "MealSuggestionRecipe"("suggestionId", "recipeId");

-- AddForeignKey
ALTER TABLE "MealSuggestion" ADD CONSTRAINT "MealSuggestion_acceptedRecipeId_fkey" FOREIGN KEY ("acceptedRecipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
