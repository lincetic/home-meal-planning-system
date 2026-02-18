import { z } from "zod";
import { zId } from "../common/ids";

export const zGetIngredientsByIdsQuery = z.object({
    ids: z.string().min(1), // comma-separated UUIDs
});

export const zIngredientDto = z.object({
    id: zId,
    name: z.string().min(1),
    category: z.string().nullable().optional(),
});

export const zGetIngredientsByIdsResponse = z.object({
    items: z.array(zIngredientDto),
});
