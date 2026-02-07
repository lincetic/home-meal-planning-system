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
    it("accepts a suggestion, consumes inventory, and sets status to ACEPTADA", async () => {
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

        const out = await uc.execute({ suggestionId });

        expect(out).toEqual({ suggestionId, status: "ACEPTADA" });

        // Inventory consumed: milk 2->1, rice 1->0 (removed)
        const invAfter = await inventoryRepo.getByHouseholdId(householdId);
        expect(invAfter?.getItem("milk")?.getQuantity().getValue()).toBe(1);
        expect(invAfter?.getItem("rice")).toBeUndefined();

        // Status updated
        const sAfter = await suggestionRepo.getById(suggestionId);
        expect(sAfter?.status).toBe("ACEPTADA");
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
            recipes: [{ recipeId: "r1", name: "Milk & Cereal", position: 0 }],
        };
        const suggestionRepo = new FakeSuggestionRepo([suggestion]);

        const uc = new AcceptSuggestionUseCase(suggestionRepo, inventoryRepo, recipeRepo);

        const out = await uc.execute({ suggestionId });

        expect(out).toEqual({ suggestionId, status: "ACEPTADA" });
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

        await expect(uc.execute({ suggestionId })).rejects.toThrow();
    });
});
