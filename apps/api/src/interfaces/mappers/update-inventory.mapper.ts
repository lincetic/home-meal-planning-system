import {
    UpdateInventoryRequest,
    UpdateInventoryResponse,
} from "@tfm/contracts";

import {
    UpdateInventoryInput,
    UpdateInventoryOutput,
} from "../../application/use-cases/update-inventory/update-inventory.dto";

export function toUpdateInventoryInput(req: UpdateInventoryRequest): UpdateInventoryInput {
    return {
        householdId: req.householdId,
        operations: req.operations.map((op) => {
            if (op.type === "ADD") {
                return {
                    type: "ADD",
                    ingredientId: op.ingredientId,
                    amount: op.amount,
                    expirationDate: op.expirationDate,
                };
            }
            return {
                type: "CONSUME",
                ingredientId: op.ingredientId,
                amount: op.amount,
            };
        }),
    };
}

export function toUpdateInventoryResponse(out: UpdateInventoryOutput): UpdateInventoryResponse {
    return {
        householdId: out.householdId,
        items: out.items.map((i) => ({
            ingredientId: i.ingredientId,
            quantity: i.quantity,
            expirationDate: i.expirationDate,
        })),
    };
}
