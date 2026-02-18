import { describe, expect, it } from "vitest";
import { GetInventoryUseCase } from "../get-inventory.usecase";
import type { InventoryRepository } from "../../../ports/inventory-repository";
import { Inventory } from "../../../../domain/entities/inventory";
import { Quantity } from "../../../../domain/value-objects/quantity";

class FakeInventoryRepo implements InventoryRepository {
    constructor(private readonly inventory: Inventory | null) { }

    async getByHouseholdId(): Promise<Inventory | null> {
        return this.inventory;
    }

    async save(): Promise<void> {
        throw new Error("not needed");
    }
}

describe("GetInventoryUseCase", () => {
    it("returns empty items when household has no inventory", async () => {
        const uc = new GetInventoryUseCase(new FakeInventoryRepo(null));

        const out = await uc.execute({ householdId: "home-1" });

        expect(out).toEqual({ householdId: "home-1", items: [] });
    });

    it("maps inventory items to primitives and ISO dates", async () => {
        const inventory = new Inventory();
        inventory.addIngredient("milk", Quantity.create(2), new Date("2026-02-05"));
        inventory.addIngredient("rice", Quantity.create(1));

        const uc = new GetInventoryUseCase(new FakeInventoryRepo(inventory));

        const out = await uc.execute({ householdId: "home-1" });

        expect(out.householdId).toBe("home-1");
        expect(out.items).toEqual(
            expect.arrayContaining([
                {
                    ingredientId: "milk",
                    quantity: 2,
                    expirationDate: "2026-02-05",
                },
                {
                    ingredientId: "rice",
                    quantity: 1,
                    expirationDate: null,
                },
            ])
        );
    });
});
