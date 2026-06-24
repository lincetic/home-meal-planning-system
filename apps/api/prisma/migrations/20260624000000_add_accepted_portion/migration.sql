-- CreateEnum
CREATE TYPE "RecipePortion" AS ENUM ('FULL', 'HALF');

-- AlterTable
ALTER TABLE "MealSuggestion"
ADD COLUMN "acceptedPortion" "RecipePortion" NOT NULL DEFAULT 'FULL';
