import { describe, it, expect } from "vitest";
import { GenerateShoppingListUseCase } from "../generate-shopping-list.usecase";
import { Inventory } from "../../../../domain/entities/inventory";
import { Quantity } from "../../../../domain/value-objects/quantity";
import { InventoryRepository } from "../../../ports/inventory-repository";

class FakeInventoryRepo implements InventoryRepository {
    constructor(private inv: Inventory | null) { }

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

    it("acumula requerimientos de un mismo ingrediente entre recetas", async () => {
        const inv = new Inventory();
        inv.addIngredient("rice", Quantity.create(1));

        const repo = new FakeInventoryRepo(inv);
        const uc = new GenerateShoppingListUseCase(repo);

        const out = await uc.execute({
            householdId: "home-1",
            recipes: [
                {
                    recipeId: "r1",
                    ingredients: [{ ingredientId: "rice", amount: 1 }],
                },
                {
                    recipeId: "r2",
                    ingredients: [{ ingredientId: "rice", amount: 2 }],
                },
            ],
        });

        expect(out.items).toEqual([{ ingredientId: "rice", missingAmount: 2 }]);
    });

    it("falla si no existe inventario para el hogar", async () => {
        const repo = new FakeInventoryRepo(null);
        const uc = new GenerateShoppingListUseCase(repo);

        await expect(
            uc.execute({
                householdId: "home-1",
                recipes: [],
            })
        ).rejects.toThrow(/inventory not found/i);
    });
});
