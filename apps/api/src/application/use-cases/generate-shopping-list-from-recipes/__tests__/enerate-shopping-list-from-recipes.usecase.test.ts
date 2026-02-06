import { describe, it, expect } from "vitest";
import { Inventory } from "../../../../domain/entities/inventory";
import { Quantity } from "../../../../domain/value-objects/quantity";
import { Recipe } from "../../../../domain/entities/recipe";
import { InventoryRepository } from "../../../ports/inventory-repository";
import { RecipeRepository } from "../../../ports/recipe-repository";
import { GenerateShoppingListFromRecipesUseCase } from "../generate-shopping-list-from-recipes.usecase";

class FakeInventoryRepo implements InventoryRepository {
    constructor(private inv: Inventory | null) { }
    async getByHouseholdId(): Promise<Inventory | null> { return this.inv; }
    async save(): Promise<void> { }
}

class FakeRecipeRepo implements RecipeRepository {
    constructor(private recipes: Recipe[]) { }
    async listByHouseholdId(): Promise<Recipe[]> { return this.recipes; }
    async getByIds(_: string, ids: string[]): Promise<Recipe[]> {
        return this.recipes.filter(r => ids.includes(r.getId()));
    }
}

describe("GenerateShoppingListFromRecipesUseCase", () => {
    it("genera faltantes cargando recetas por id", async () => {
        const inv = new Inventory();
        inv.addIngredient("22222222-2222-2222-2222-222222222222", Quantity.create(2)); // milk=2

        const milk = "22222222-2222-2222-2222-222222222222";
        const rice = "33333333-3333-3333-3333-333333333333";

        const r1 = new Recipe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "Milk & Cereal", [
            { ingredientId: milk, amount: Quantity.create(3) }, // requiere 3, faltará 1
        ]);

        const r2 = new Recipe("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "Rice Bowl", [
            { ingredientId: rice, amount: Quantity.create(1) }, // no hay rice en inv, faltará 1
        ]);

        const uc = new GenerateShoppingListFromRecipesUseCase(
            new FakeInventoryRepo(inv),
            new FakeRecipeRepo([r1, r2])
        );

        const out = await uc.execute({
            householdId: "home-1",
            recipeIds: [r1.getId(), r2.getId()],
        });

        expect(out.items).toEqual([
            { ingredientId: milk, missingAmount: 1 },
            { ingredientId: rice, missingAmount: 1 },
        ]);
    });
});
