import { describe, it, expect } from "vitest";
import { toUpdateInventoryInput, toUpdateInventoryResponse } from "../update-inventory.mapper";

describe("UpdateInventory mapper", () => {
    it("mapea request contract -> input use case", () => {
        const input = toUpdateInventoryInput({
            householdId: "550e8400-e29b-41d4-a716-446655440000",
            operations: [
                {
                    type: "ADD",
                    ingredientId: "550e8400-e29b-41d4-a716-446655440000",
                    amount: 2,
                    expirationDate: "2026-02-05",
                },
            ],
        });

        expect(input.householdId).toBeDefined();
        expect(input.operations[0].type).toBe("ADD");
    });

    it("mapea output use case -> response contract", () => {
        const res = toUpdateInventoryResponse({
            householdId: "home-1",
            items: [{ ingredientId: "milk", quantity: 2, expirationDate: "2026-02-05" }],
        });

        expect(res.items[0].quantity).toBe(2);
    });
});
