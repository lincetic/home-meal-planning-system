import { describe, it, expect } from "vitest";
import { GenerateDailySuggestionUseCase } from "../generate-daily-suggestion.usecase";
import { InventoryRepository } from "../../../ports/inventory-repository";
import { RecipeRepository } from "../../../ports/recipe-repository";
import { Inventory } from "../../../../domain/entities/inventory";
import { Quantity } from "../../../../domain/value-objects/quantity";
import { Recipe } from "../../../../domain/entities/recipe";

class FakeInventoryRepo implements InventoryRepository {
    private inv: Inventory | null = null;

    setInventory(inv: Inventory) {
        this.inv = inv;
    }

    async getByHouseholdId(): Promise<Inventory | null> {
        return this.inv;
    }

    async save(): Promise<void> {
        // not needed in this use case
    }
}

class FakeRecipeRepo implements RecipeRepository {
    constructor(private recipes: Recipe[]) { }

    async listByHouseholdId(): Promise<Recipe[]> {
        return this.recipes;
    }
}

describe("GenerateDailySuggestionUseCase", () => {
    it("prioriza recetas que usan ingredientes próximos a caducar", async () => {
        const inv = new Inventory();
        inv.addIngredient("milk", Quantity.create(1), new Date("2026-02-05")); // expiring soon (ref 2026-02-03)
        inv.addIngredient("rice", Quantity.create(1));
        inv.addIngredient("eggs", Quantity.create(2), new Date("2026-02-20")); // not soon

        const r1 = new Recipe("r1", "Milk & Cereal", [{ ingredientId: "milk", amount: Quantity.create(1) }]);
        const r2 = new Recipe("r2", "Rice Bowl", [{ ingredientId: "rice", amount: Quantity.create(1) }]);
        const r3 = new Recipe("r3", "Omelette", [{ ingredientId: "eggs", amount: Quantity.create(2) }]);

        const invRepo = new FakeInventoryRepo();
        invRepo.setInventory(inv);

        const recipeRepo = new FakeRecipeRepo([r1, r2, r3]);

        const uc = new GenerateDailySuggestionUseCase(invRepo, recipeRepo);

        const out = await uc.execute({
            householdId: "home-1",
            date: "2026-02-03",
            slot: "CENA",
            maxSuggestions: 2,
            expiringDaysThreshold: 3,
        });

        expect(out.recipes.length).toBe(2);
        // La primera debería ser la que usa milk (expiring soon)
        expect(out.recipes[0].recipeId).toBe("r1");
        expect(out.reasoning.usedExpiringIngredients).toContain("milk");
    });

    it("no sugiere recetas si faltan ingredientes", async () => {
        const inv = new Inventory();
        inv.addIngredient("rice", Quantity.create(1));

        const r1 = new Recipe("r1", "Omelette", [{ ingredientId: "eggs", amount: Quantity.create(2) }]);

        const invRepo = new FakeInventoryRepo();
        invRepo.setInventory(inv);

        const recipeRepo = new FakeRecipeRepo([r1]);
        const uc = new GenerateDailySuggestionUseCase(invRepo, recipeRepo);

        const out = await uc.execute({
            householdId: "home-1",
            date: "2026-02-03",
            slot: "COMIDA",
        });

        expect(out.recipes.length).toBe(0);
        expect(out.reasoning.totalCandidateRecipes).toBe(0);
    });

    it("devuelve vacío si no hay inventario", async () => {
        const invRepo = new FakeInventoryRepo(); // null
        const recipeRepo = new FakeRecipeRepo([]);
        const uc = new GenerateDailySuggestionUseCase(invRepo, recipeRepo);

        const out = await uc.execute({
            householdId: "home-1",
            date: "2026-02-03",
            slot: "DESAYUNO",
        });

        expect(out.recipes.length).toBe(0);
    });
});
