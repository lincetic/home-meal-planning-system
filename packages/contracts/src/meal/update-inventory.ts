import { z } from "zod";
import { zId } from "../common/ids";

const zDateYYYYMMDD = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const zUpdateInventoryOperation = z.union([
    z.object({
        type: z.literal("ADD"),
        ingredientId: zId,
        amount: z.number().nonnegative(),
        expirationDate: zDateYYYYMMDD.optional(),
    }),
    z.object({
        type: z.literal("CONSUME"),
        ingredientId: zId,
        amount: z.number().nonnegative(),
    }),
]);

export const zUpdateInventoryRequest = z.object({
    householdId: zId,
    operations: z.array(zUpdateInventoryOperation).min(1),
});

export const zInventoryItemSnapshot = z.object({
    ingredientId: zId,
    quantity: z.number().nonnegative(),
    expirationDate: zDateYYYYMMDD.optional(),
});

export const zUpdateInventoryResponse = z.object({
    householdId: zId,
    items: z.array(zInventoryItemSnapshot),
});

export type UpdateInventoryRequest = z.infer<typeof zUpdateInventoryRequest>;
export type UpdateInventoryResponse = z.infer<typeof zUpdateInventoryResponse>;
