import { z } from "zod";
import { zId } from "../common/ids";

export const zGetInventoryQuery = z.object({
    householdId: zId,
});

export const zInventoryItemDto = z.object({
    ingredientId: zId,
    quantity: z.number().nonnegative(),
    expirationDate: z.string().nullable(),
});


export const zGetInventoryResponse = z.object({
    householdId: zId,
    items: z.array(zInventoryItemDto),
});

export type GetInventoryQuery = z.infer<typeof zGetInventoryQuery>;
export type GetInventoryResponse = z.infer<typeof zGetInventoryResponse>;
