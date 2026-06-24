import { describe, it, expect } from "vitest";
import { AcceptSuggestionUseCase } from "../accept-suggestion.usecase";
import { Inventory } from "../../../../domain/entities/inventory";
import { Quantity } from "../../../../domain/value-objects/quantity";
import { Recipe } from "../../../../domain/entities/recipe";
import type { InventoryRepository } from "../../../ports/inventory-repository";
import type { RecipeRepository } from "../../../ports/recipe-repository";
import type {
    PersistedSuggestion,
    SuggestionRepository,
    SuggestionStatus,
} from "../../../ports/suggestion-repository";

class FakeSuggestionRepo implements SuggestionRepository {
    private byId = new Map<string, PersistedSuggestion>();

    constructor(seed: PersistedSuggestion[]) {
        seed.forEach((s) => this.byId.set(s.id, s));
    }

    async upsertDailySuggestion(): Promise<PersistedSuggestion> {
        throw new Error("not needed");
    }
    async getDailySuggestion(): Promise<PersistedSuggestion | null> {
        throw new Error("not needed");
    }

    async getById(id: string): Promise<PersistedSuggestion | null> {
        return this.byId.get(id) ?? null;
    }

    async setStatus(suggestionId: string, status: SuggestionStatus): Promise<void> {
        const s = this.byId.get(suggestionId);
        if (!s) throw new Error("Suggestion not found");
        this.byId.set(suggestionId, { ...s, status });
    }

    async setAcceptedRecipe(
        suggestionId: string,
        recipeId: string,
        portion: "FULL" | "HALF"
    ): Promise<void> {
        const s = this.byId.get(suggestionId);
        if (!s) throw new Error("Suggestion not found");
        this.byId.set(suggestionId, {
            ...s,
            acceptedRecipeId: recipeId,
            acceptedPortion: portion,
        });
    }
}

class FakeInventoryRepo implements InventoryRepository {
    public saved: { householdId: string; inventory: Inventory } | null = null;

    constructor(private invByHousehold: Map<string, Inventory>) { }

    async getByHouseholdId(householdId: string): Promise<Inventory | null> {
        return this.invByHousehold.get(householdId) ?? null;
    }

    async save(householdId: string, inventory: Inventory): Promise<void> {
        this.invByHousehold.set(householdId, inventory);
        this.saved = { householdId, inventory };
    }
}

class FakeRecipeRepo implements RecipeRepository {
    constructor(private recipesByHousehold: Map<string, Recipe[]>) { }

    async listByHouseholdId(householdId: string): Promise<Recipe[]> {
        return this.recipesByHousehold.get(householdId) ?? [];
    }

    async getByIds(householdId: string, recipeIds: string[]): Promise<Recipe[]> {
        const all = this.recipesByHousehold.get(householdId) ?? [];
        return all.filter((r) => recipeIds.includes(r.getId()));
    }
}

describe("AcceptSuggestionUseCase", () => {

    it("accepts a suggestion for a selected recipe, consumes only that recipe ingredients, and sets status to ACEPTADA", async () => {
        const householdId = "home-1";
        const suggestionId = "sug-1";

        // Inventory: milk=2, rice=1
        const inv = new Inventory();
        inv.addIngredient("milk", Quantity.create(2));
        inv.addIngredient("rice", Quantity.create(1));

        const inventoryRepo = new FakeInventoryRepo(new Map([[householdId, inv]]));

        // Recipes: r1 consumes milk=1, r2 consumes rice=1
        const r1 = new Recipe("r1", "Milk & Cereal", [
            { ingredientId: "milk", amount: Quantity.create(1) },
        ]);
        const r2 = new Recipe("r2", "Rice Bowl", [
            { ingredientId: "rice", amount: Quantity.create(1) },
        ]);
        const recipeRepo = new FakeRecipeRepo(new Map([[householdId, [r1, r2]]]));

        const suggestion: PersistedSuggestion = {
            id: suggestionId,
            householdId,
            date: "2026-02-03",
            slot: "CENA",
            status: "PROPUESTA",
            recipes: [
                { recipeId: "r1", name: "Milk & Cereal", position: 0 },
                { recipeId: "r2", name: "Rice Bowl", position: 1 },
            ],
        };
        const suggestionRepo = new FakeSuggestionRepo([suggestion]);

        const uc = new AcceptSuggestionUseCase(suggestionRepo, inventoryRepo, recipeRepo);

        // Select recipe r2 only
        const out = await uc.execute({ suggestionId, recipeId: "r2" });

        // Output should include accepted status (and optionally acceptedRecipeId if you add it)
        expect(out).toEqual({
            suggestionId,
            status: "ACEPTADA",
            acceptedRecipeId: "r2",
            acceptedPortion: "FULL",
        });

        // Inventory consumed ONLY for r2:
        // milk stays 2, rice 1->0 (removed)
        const invAfter = await inventoryRepo.getByHouseholdId(householdId);
        expect(invAfter?.getItem("milk")?.getQuantity().getValue()).toBe(2);
        expect(invAfter?.getItem("rice")).toBeUndefined();

        // Status updated
        const sAfter = await suggestionRepo.getById(suggestionId);
        expect(sAfter?.status).toBe("ACEPTADA");
    });

    it("throws when selected recipeId is not part of the suggestion", async () => {
        const householdId = "home-1";
        const suggestionId = "sug-1b";

        const inv = new Inventory();
        inv.addIngredient("milk", Quantity.create(2));
        inv.addIngredient("rice", Quantity.create(1));
        const inventoryRepo = new FakeInventoryRepo(new Map([[householdId, inv]]));

        const r1 = new Recipe("r1", "Milk & Cereal", [
            { ingredientId: "milk", amount: Quantity.create(1) },
        ]);
        const r2 = new Recipe("r2", "Rice Bowl", [
            { ingredientId: "rice", amount: Quantity.create(1) },
        ]);
        const recipeRepo = new FakeRecipeRepo(new Map([[householdId, [r1, r2]]]));

        const suggestion: PersistedSuggestion = {
            id: suggestionId,
            householdId,
            date: "2026-02-03",
            slot: "CENA",
            status: "PROPUESTA",
            recipes: [
                { recipeId: "r1", name: "Milk & Cereal", position: 0 },
                { recipeId: "r2", name: "Rice Bowl", position: 1 },
            ],
        };
        const suggestionRepo = new FakeSuggestionRepo([suggestion]);

        const uc = new AcceptSuggestionUseCase(suggestionRepo, inventoryRepo, recipeRepo);

        await expect(uc.execute({ suggestionId, recipeId: "r3" })).rejects.toThrow();
    });

    it("is idempotent: accepting an already accepted suggestion returns ACEPTADA and does not throw", async () => {
        const householdId = "home-1";
        const suggestionId = "sug-2";

        const inv = new Inventory();
        inv.addIngredient("milk", Quantity.create(2));
        const inventoryRepo = new FakeInventoryRepo(new Map([[householdId, inv]]));

        const r1 = new Recipe("r1", "Milk & Cereal", [
            { ingredientId: "milk", amount: Quantity.create(1) },
        ]);
        const recipeRepo = new FakeRecipeRepo(new Map([[householdId, [r1]]]));

        const suggestion: PersistedSuggestion = {
            id: suggestionId,
            householdId,
            date: "2026-02-03",
            slot: "CENA",
            status: "ACEPTADA",
            acceptedRecipeId: "r1",
            acceptedPortion: "HALF",
            recipes: [{ recipeId: "r1", name: "Milk & Cereal", position: 0 }],
        };
        const suggestionRepo = new FakeSuggestionRepo([suggestion]);

        const uc = new AcceptSuggestionUseCase(suggestionRepo, inventoryRepo, recipeRepo);

        const out = await uc.execute({ suggestionId, portion: "FULL" });

        expect(out).toEqual({
            suggestionId,
            status: "ACEPTADA",
            acceptedRecipeId: "r1",
            acceptedPortion: "HALF",
        });
        expect(inv.getItem("milk")?.getQuantity().getValue()).toBe(2);
    });

    it("throws when inventory is insufficient (conflict case)", async () => {
        const householdId = "home-1";
        const suggestionId = "sug-3";

        const inv = new Inventory();
        inv.addIngredient("milk", Quantity.create(0)); // no milk
        const inventoryRepo = new FakeInventoryRepo(new Map([[householdId, inv]]));

        const r1 = new Recipe("r1", "Milk & Cereal", [
            { ingredientId: "milk", amount: Quantity.create(1) },
        ]);
        const recipeRepo = new FakeRecipeRepo(new Map([[householdId, [r1]]]));

        const suggestion: PersistedSuggestion = {
            id: suggestionId,
            householdId,
            date: "2026-02-03",
            slot: "CENA",
            status: "PROPUESTA",
            recipes: [{ recipeId: "r1", name: "Milk & Cereal", position: 0 }],
        };
        const suggestionRepo = new FakeSuggestionRepo([suggestion]);

        const uc = new AcceptSuggestionUseCase(suggestionRepo, inventoryRepo, recipeRepo);

        await expect(uc.execute({ suggestionId, recipeId: "r1" })).rejects.toThrow();
    });

    it("accepts half a recipe and consumes half of every ingredient requirement", async () => {
        const householdId = "home-half";
        const suggestionId = "sug-half";
        const inv = new Inventory();
        inv.addIngredient("rice", Quantity.create(1));

        const inventoryRepo = new FakeInventoryRepo(new Map([[householdId, inv]]));
        const recipeRepo = new FakeRecipeRepo(new Map([
            [householdId, [
                new Recipe("r-half", "Rice Bowl", [
                    { ingredientId: "rice", amount: Quantity.create(2) },
                ]),
            ]],
        ]));
        const suggestionRepo = new FakeSuggestionRepo([{
            id: suggestionId,
            householdId,
            date: "2026-06-24",
            slot: "COMIDA",
            status: "PROPUESTA",
            recipes: [{ recipeId: "r-half", name: "Rice Bowl", position: 0 }],
        }]);

        const uc = new AcceptSuggestionUseCase(suggestionRepo, inventoryRepo, recipeRepo);

        const out = await uc.execute({
            suggestionId,
            recipeId: "r-half",
            portion: "HALF",
        });

        expect(out).toEqual({
            suggestionId,
            status: "ACEPTADA",
            acceptedRecipeId: "r-half",
            acceptedPortion: "HALF",
        });
        expect(inv.getItem("rice")).toBeUndefined();
    });

    it("rejects a half recipe when inventory is still insufficient without saving", async () => {
        const householdId = "home-insufficient-half";
        const suggestionId = "sug-insufficient-half";
        const inv = new Inventory();
        inv.addIngredient("rice", Quantity.create(0.4));

        const inventoryRepo = new FakeInventoryRepo(new Map([[householdId, inv]]));
        const recipeRepo = new FakeRecipeRepo(new Map([
            [householdId, [
                new Recipe("r-half", "Rice Bowl", [
                    { ingredientId: "rice", amount: Quantity.create(2) },
                ]),
            ]],
        ]));
        const suggestionRepo = new FakeSuggestionRepo([{
            id: suggestionId,
            householdId,
            date: "2026-06-24",
            slot: "COMIDA",
            status: "PROPUESTA",
            recipes: [{ recipeId: "r-half", name: "Rice Bowl", position: 0 }],
        }]);

        const uc = new AcceptSuggestionUseCase(suggestionRepo, inventoryRepo, recipeRepo);

        await expect(uc.execute({
            suggestionId,
            recipeId: "r-half",
            portion: "HALF",
        })).rejects.toThrow("Not enough inventory");
        expect(inventoryRepo.saved).toBeNull();
        expect(inv.getItem("rice")?.getQuantity().getValue()).toBe(0.4);
    });

});
