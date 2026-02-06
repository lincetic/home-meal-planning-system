import { z } from "zod";
import { zId } from "../common/ids";

export const zGenerateShoppingListFromRecipesRequest = z.object({
    householdId: zId,
    recipeIds: z.array(zId).min(1),
});

export const zShoppingListItem = z.object({
    ingredientId: zId,
    missingAmount: z.number().nonnegative(),
});

export const zGenerateShoppingListFromRecipesResponse = z.object({
    householdId: zId,
    items: z.array(zShoppingListItem),
});

export type GenerateShoppingListFromRecipesRequest = z.infer<
    typeof zGenerateShoppingListFromRecipesRequest
>;

export type GenerateShoppingListFromRecipesResponse = z.infer<
    typeof zGenerateShoppingListFromRecipesResponse
>;
