import { z } from "zod";
import { zId } from "../common/ids";
import { zMealSlot, zSuggestionStatus } from "../common/enums";

const zDateYYYYMMDD = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const zGenerateDailySuggestionRequest = z.object({
    householdId: zId,
    date: zDateYYYYMMDD,
    slot: zMealSlot,
    maxSuggestions: z.number().int().min(1).max(3).optional(),
    expiringDaysThreshold: z.number().int().min(1).max(30).optional(),
});

export const zSuggestedRecipe = z.object({
    recipeId: zId,
    name: z.string().min(1),
});

export const zGenerateDailySuggestionResponse = z.object({
    householdId: zId,
    date: zDateYYYYMMDD,
    slot: zMealSlot,
    status: zSuggestionStatus.default("PROPUESTA"),
    recipes: z.array(zSuggestedRecipe).max(3),
    reasoning: z.object({
        usedExpiringIngredients: z.array(zId),
        totalCandidateRecipes: z.number().int().min(0),
    }),
});

export type GenerateDailySuggestionRequest = z.infer<typeof zGenerateDailySuggestionRequest>;
export type GenerateDailySuggestionResponse = z.infer<typeof zGenerateDailySuggestionResponse>;
