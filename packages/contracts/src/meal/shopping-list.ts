import { z } from "zod";
import { zId } from "../common/ids";

export const zShoppingListRecipeIngredient = z.object({
    ingredientId: zId,
    amount: z.number().nonnegative(),
});

export const zShoppingListRecipe = z.object({
    recipeId: zId,
    ingredients: z.array(zShoppingListRecipeIngredient).min(1),
});

export const zGenerateShoppingListRequest = z.object({
    householdId: zId,
    recipes: z.array(zShoppingListRecipe).min(1),
});

export const zShoppingListItem = z.object({
    ingredientId: zId,
    missingAmount: z.number().nonnegative(),
});

export const zGenerateShoppingListResponse = z.object({
    householdId: zId,
    items: z.array(zShoppingListItem),
});

export type GenerateShoppingListRequest = z.infer<typeof zGenerateShoppingListRequest>;
export type GenerateShoppingListResponse = z.infer<typeof zGenerateShoppingListResponse>;
