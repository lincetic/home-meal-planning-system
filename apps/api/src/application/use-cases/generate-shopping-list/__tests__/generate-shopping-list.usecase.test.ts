import { describe, it, expect } from "vitest";
import { GenerateShoppingListUseCase } from "../generate-shopping-list.usecase";
import { Inventory } from "../../../../domain/entities/inventory";
import { Quantity } from "../../../../domain/value-objects/quantity";
import { InventoryRepository } from "../../../ports/inventory-repository";

class FakeInventoryRepo implements InventoryRepository {
    constructor(private inv: Inventory) { }

    async getByHouseholdId(): Promise<Inventory | null> {
        return this.inv;
    }

    async save(): Promise<void> { }
}

describe("GenerateShoppingListUseCase", () => {
    it("genera lista solo con ingredientes faltantes", async () => {
        const inv = new Inventory();
        inv.addIngredient("rice", Quantity.create(1));
        inv.addIngredient("milk", Quantity.create(1));

        const repo = new FakeInventoryRepo(inv);
        const uc = new GenerateShoppingListUseCase(repo);

        const out = await uc.execute({
            householdId: "home-1",
            recipes: [
                {
                    recipeId: "r1",
                    ingredients: [
                        { ingredientId: "rice", amount: 2 },
                        { ingredientId: "milk", amount: 1 },
                        { ingredientId: "eggs", amount: 2 },
                    ],
                },
            ],
        });

        expect(out.items).toEqual([
            { ingredientId: "rice", missingAmount: 1 },
            { ingredientId: "eggs", missingAmount: 2 },
        ]);
    });
});
