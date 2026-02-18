import { describe, expect, it } from "vitest";
import { GetCookingPlanUseCase } from "../get-cooking-plan.usecase";
import type { InventoryRepository } from "../../../ports/inventory-repository";
import type { RecipeRepository } from "../../../ports/recipe-repository";
import { Inventory } from "../../../../domain/entities/inventory";
import { Recipe } from "../../../../domain/entities/recipe";
import { Quantity } from "../../../../domain/value-objects/quantity";
import { GenerateAndStoreDailySuggestionUseCase } from "../../generate-and-store-daily-suggestion/generate-and-store-daily-suggestion.usecase";

class FakeInventoryRepo implements InventoryRepository {
    constructor(private readonly inventory: Inventory | null) { }

    async getByHouseholdId(): Promise<Inventory | null> {
        return this.inventory;
    }

    async save(): Promise<void> {
        throw new Error("not needed");
    }
}

class FakeRecipeRepo implements RecipeRepository {
    constructor(private readonly recipes: Recipe[]) { }

    async listByHouseholdId(): Promise<Recipe[]> {
        return this.recipes;
    }

    async getByIds(_: string, recipeIds: string[]): Promise<Recipe[]> {
        return this.recipes.filter((r) => recipeIds.includes(r.getId()));
    }
}

describe("GetCookingPlanUseCase", () => {
    it("throws when there are no recipes available", async () => {
        const uc = new GetCookingPlanUseCase(
            new FakeInventoryRepo(new Inventory()),
            new FakeRecipeRepo([]),
            {} as GenerateAndStoreDailySuggestionUseCase
        );

        await expect(
            uc.execute({
                householdId: "home-1",
                date: "2026-02-03",
                slot: "CENA",
            })
        ).rejects.toThrow("No recipes available");
    });

    it("returns suggestion when at least one recipe is cookable", async () => {
        const inventory = new Inventory();
        inventory.addIngredient("milk", Quantity.create(1));

        const recipes = [
            new Recipe("r1", "Milk & Cereal", [
                { ingredientId: "milk", amount: Quantity.create(1) },
            ]),
        ];

        const generator = {
            execute: async () => ({
                id: "sug-1",
                householdId: "home-1",
                date: "2026-02-03",
                slot: "CENA" as const,
                status: "PROPUESTA" as const,
                recipes: [{ recipeId: "r1", name: "Milk & Cereal", position: 0 }],
            }),
        } as GenerateAndStoreDailySuggestionUseCase;

        const uc = new GetCookingPlanUseCase(
            new FakeInventoryRepo(inventory),
            new FakeRecipeRepo(recipes),
            generator
        );

        const out = await uc.execute({
            householdId: "home-1",
            date: "2026-02-03",
            slot: "CENA",
        });

        expect(out).toEqual({
            kind: "SUGGESTION",
            suggestionId: "sug-1",
            status: "PROPUESTA",
            householdId: "home-1",
            date: "2026-02-03",
            slot: "CENA",
            recipes: [{ recipeId: "r1", name: "Milk & Cereal", position: 0 }],
        });
    });

    it("returns shopping list for best candidate when no recipe is cookable", async () => {
        const inventory = new Inventory();
        inventory.addIngredient("milk", Quantity.create(1));

        const milkRecipe = new Recipe("r1", "More Milk", [
            { ingredientId: "milk", amount: Quantity.create(2) },
        ]);
        const eggsRecipe = new Recipe("r2", "Egg Omelette", [
            { ingredientId: "eggs", amount: Quantity.create(1) },
        ]);

        const uc = new GetCookingPlanUseCase(
            new FakeInventoryRepo(inventory),
            new FakeRecipeRepo([milkRecipe, eggsRecipe]),
            {} as GenerateAndStoreDailySuggestionUseCase
        );

        const out = await uc.execute({
            householdId: "home-1",
            date: "2026-02-03",
            slot: "CENA",
        });

        expect(out).toEqual({
            kind: "NEEDS_SHOPPING",
            householdId: "home-1",
            date: "2026-02-03",
            slot: "CENA",
            targetRecipe: {
                recipeId: "r1",
                name: "More Milk",
            },
            shoppingList: {
                items: [{ ingredientId: "milk", missingAmount: 1 }],
            },
        });
    });
});
