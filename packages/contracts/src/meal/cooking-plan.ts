import { z } from "zod";
import { zId } from "../common/ids";
import { zMealSlot, zSuggestionStatus } from "../common/enums";

const zDateYYYYMMDD = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const zGetCookingPlanRequest = z.object({
    householdId: zId,
    date: zDateYYYYMMDD,
    slot: zMealSlot,
    maxSuggestions: z.number().int().min(1).max(3).optional(),
});

const zSuggestedRecipe = z.object({
    recipeId: zId,
    name: z.string().min(1),
    position: z.number().int().min(0),
});

const zShoppingItem = z.object({
    ingredientId: zId,
    missingAmount: z.number().positive(),
});

export const zCookingPlanSuggestion = z.object({
    kind: z.literal("SUGGESTION"),
    suggestionId: zId,
    status: zSuggestionStatus,
    householdId: zId,
    date: zDateYYYYMMDD,
    slot: zMealSlot,
    recipes: z.array(zSuggestedRecipe).min(1).max(3),
});

export const zCookingPlanNeedsShopping = z.object({
    kind: z.literal("NEEDS_SHOPPING"),
    householdId: zId,
    date: zDateYYYYMMDD,
    slot: zMealSlot,
    targetRecipe: z.object({
        recipeId: zId,
        name: z.string().min(1),
    }),
    shoppingList: z.object({
        items: z.array(zShoppingItem).min(1),
    }),
});

export const zGetCookingPlanResponse = z.union([
    zCookingPlanSuggestion,
    zCookingPlanNeedsShopping,
]);

export type GetCookingPlanRequest = z.infer<typeof zGetCookingPlanRequest>;
export type GetCookingPlanResponse = z.infer<typeof zGetCookingPlanResponse>;
