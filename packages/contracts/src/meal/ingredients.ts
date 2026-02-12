import { z } from "zod";
import { zId } from "../common/ids";

export const zIngredient = z.object({
    id: zId,
    name: z.string().min(1),
    category: z.string().nullable().optional(),
});

export const zSearchIngredientsQuery = z.object({
    q: z.string().min(1),
    limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const zSearchIngredientsResponse = z.object({
    items: z.array(zIngredient),
});

export const zCreateIngredientRequest = z.object({
    name: z.string().min(1),
    category: z.string().optional(),
});

export const zCreateIngredientResponse = zIngredient;

export type SearchIngredientsQuery = z.infer<typeof zSearchIngredientsQuery>;
export type SearchIngredientsResponse = z.infer<typeof zSearchIngredientsResponse>;
export type CreateIngredientRequest = z.infer<typeof zCreateIngredientRequest>;
export type CreateIngredientResponse = z.infer<typeof zCreateIngredientResponse>;
