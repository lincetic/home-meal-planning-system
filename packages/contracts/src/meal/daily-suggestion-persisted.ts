import { z } from "zod";
import { zId } from "../common/ids";
import { zMealSlot, zSuggestionStatus } from "../common/enums";

const zDateYYYYMMDD = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const zGenerateDailySuggestionPersistedRequest = z.object({
    householdId: zId,
    date: zDateYYYYMMDD,
    slot: zMealSlot,
    maxSuggestions: z.number().int().min(1).max(3).optional(),
    expiringDaysThreshold: z.number().int().min(1).max(30).optional(),
});

export const zPersistedSuggestedRecipe = z.object({
    recipeId: zId,
    name: z.string().min(1),
    position: z.number().int().min(0),
});

export const zGenerateDailySuggestionPersistedResponse = z.object({
    suggestionId: zId,
    householdId: zId,
    date: zDateYYYYMMDD,
    slot: zMealSlot,
    status: zSuggestionStatus,
    recipes: z.array(zPersistedSuggestedRecipe).max(3),
});

export type GenerateDailySuggestionPersistedRequest = z.infer<
    typeof zGenerateDailySuggestionPersistedRequest
>;

export type GenerateDailySuggestionPersistedResponse = z.infer<
    typeof zGenerateDailySuggestionPersistedResponse
>;
