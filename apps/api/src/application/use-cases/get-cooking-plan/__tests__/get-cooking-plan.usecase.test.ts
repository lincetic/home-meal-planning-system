import { describe, expect, it, vi } from "vitest";
import { GetCookingPlanUseCase } from "../get-cooking-plan.usecase";
import type { InventoryRepository } from "../../../ports/inventory-repository";
import type { RecipeRepository } from "../../../ports/recipe-repository";
import type { PersistedSuggestion, SuggestionRepository, SuggestionStatus } from "../../../ports/suggestion-repository";
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

class FakeSuggestionRepo implements SuggestionRepository {
    constructor(private readonly daily: PersistedSuggestion | null) { }

    async upsertDailySuggestion(): Promise<PersistedSuggestion> {
        throw new Error("not needed");
    }

    async getDailySuggestion(): Promise<PersistedSuggestion | null> {
        return this.daily;
    }

    async setStatus(): Promise<void> {
        throw new Error("not needed");
    }

    async getById(): Promise<PersistedSuggestion | null> {
        throw new Error("not needed");
    }

    async setAcceptedRecipe(): Promise<void> {
        throw new Error("not needed");
    }
}

describe("GetCookingPlanUseCase", () => {
    it("throws when there are no recipes available", async () => {
        const uc = new GetCookingPlanUseCase(
            new FakeInventoryRepo(new Inventory()),
            new FakeRecipeRepo([]),
            new FakeSuggestionRepo(null),
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
            new Recipe("r1", "Milk & Cereal", [{ ingredientId: "milk", amount: Quantity.create(1) }]),
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
            new FakeSuggestionRepo(null),
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
            acceptedRecipeId: null,
            acceptedPortion: null,
            recipes: [{ recipeId: "r1", name: "Milk & Cereal", position: 0 }],
        });
    });

    it("returns shopping list for best candidate when no recipe is cookable", async () => {
        const inventory = new Inventory();
        inventory.addIngredient("milk", Quantity.create(1));

        const milkRecipe = new Recipe("r1", "More Milk", [{ ingredientId: "milk", amount: Quantity.create(2) }]);
        const eggsRecipe = new Recipe("r2", "Egg Omelette", [{ ingredientId: "eggs", amount: Quantity.create(1) }]);

        const uc = new GetCookingPlanUseCase(
            new FakeInventoryRepo(inventory),
            new FakeRecipeRepo([milkRecipe, eggsRecipe]),
            new FakeSuggestionRepo(null),
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

    it("returns SUGGESTION with status ACEPTADA when there is already an accepted suggestion and does not regenerate", async () => {
        const householdId = "home-1";
        const date = "2026-02-03";
        const slot = "CENA" as const;

        // Inventory: both cookable
        const inventory = new Inventory();
        inventory.addIngredient("milk", Quantity.create(2));
        inventory.addIngredient("rice", Quantity.create(1));

        const r1 = new Recipe("r1", "Milk & Cereal", [{ ingredientId: "milk", amount: Quantity.create(1) }]);
        const r2 = new Recipe("r2", "Rice Bowl", [{ ingredientId: "rice", amount: Quantity.create(1) }]);

        const existing: PersistedSuggestion = {
            id: "sug-accepted",
            householdId,
            date,
            slot,
            status: "ACEPTADA" as SuggestionStatus,
            recipes: [
                { recipeId: "r1", name: "Milk & Cereal", position: 0 },
                { recipeId: "r2", name: "Rice Bowl", position: 1 },
            ],
            acceptedRecipeId: "r2",
            acceptedPortion: "HALF",
        };

        const generator = { execute: vi.fn() } as any;

        const uc = new GetCookingPlanUseCase(
            new FakeInventoryRepo(inventory),
            new FakeRecipeRepo([r1, r2]),
            new FakeSuggestionRepo(existing),
            generator
        );

        const out: any = await uc.execute({ householdId, date, slot });

        expect(out.kind).toBe("SUGGESTION");
        expect(out.status).toBe("ACEPTADA");
        expect(out.acceptedRecipeId).toBe("r2");
        expect(out.acceptedPortion).toBe("HALF");

        const accepted = out.recipes.find((x: any) => x.recipeId === out.acceptedRecipeId);
        expect(accepted).toBeTruthy();
        expect(accepted.name).toBe("Rice Bowl");

        // Should not regenerate
        expect(generator.execute).not.toHaveBeenCalled();
    });
});
