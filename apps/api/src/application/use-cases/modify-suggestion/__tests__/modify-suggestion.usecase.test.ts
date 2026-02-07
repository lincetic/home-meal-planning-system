import { describe, it, expect } from "vitest";
import { ModifySuggestionUseCase } from "../modify-suggestion.usecase";
import type { RecipeRepository } from "../../../ports/recipe-repository";
import type { PersistedSuggestion, SuggestionRepository } from "../../../ports/suggestion-repository";
import { Recipe } from "../../../../domain/entities/recipe";
import { Quantity } from "../../../../domain/value-objects/quantity";

class FakeSuggestionRepo implements SuggestionRepository {
    private byId = new Map<string, PersistedSuggestion>();
    public lastUpsert: any = null;

    constructor(seed: PersistedSuggestion[]) {
        seed.forEach((s) => this.byId.set(s.id, s));
    }

    async getById(id: string) {
        return this.byId.get(id) ?? null;
    }

    async upsertDailySuggestion(data: any) {
        this.lastUpsert = data;

        // Simulate persisted update by modifying the stored suggestion that matches household/date/slot
        const existing = [...this.byId.values()].find(
            (s) => s.householdId === data.householdId && s.date === data.date && s.slot === data.slot
        );
        if (existing) {
            const updated: PersistedSuggestion = {
                ...existing,
                status: data.status,
                recipes: data.recipes,
            };
            this.byId.set(existing.id, updated);
            return updated;
        }

        throw new Error("not needed");
    }

    async getDailySuggestion(): Promise<any> { throw new Error("not needed"); }
    async setStatus(): Promise<void> { throw new Error("not needed"); }
}

class FakeRecipeRepo implements RecipeRepository {
    constructor(private recipesByHousehold: Map<string, Recipe[]>) { }
    async listByHouseholdId(householdId: string) {
        return this.recipesByHousehold.get(householdId) ?? [];
    }
    async getByIds(householdId: string, recipeIds: string[]) {
        const all = this.recipesByHousehold.get(householdId) ?? [];
        return all.filter((r) => recipeIds.includes(r.getId()));
    }
}

describe("ModifySuggestionUseCase", () => {
    it("modifies a proposal and sets status to MODIFICADA", async () => {
        const householdId = "home-1";
        const suggestionId = "s1";

        const suggestion: PersistedSuggestion = {
            id: suggestionId,
            householdId,
            date: "2026-02-03",
            slot: "CENA",
            status: "PROPUESTA",
            recipes: [{ recipeId: "r1", name: "Old", position: 0 }],
        };

        const r1 = new Recipe("r1", "Milk & Cereal", [{ ingredientId: "milk", amount: Quantity.create(1) }]);
        const r2 = new Recipe("r2", "Rice Bowl", [{ ingredientId: "rice", amount: Quantity.create(1) }]);

        const suggestionRepo = new FakeSuggestionRepo([suggestion]);
        const recipeRepo = new FakeRecipeRepo(new Map([[householdId, [r1, r2]]]));

        const uc = new ModifySuggestionUseCase(suggestionRepo, recipeRepo);

        const out = await uc.execute({ suggestionId, recipeIds: ["r2"] });

        expect(out).toEqual({ suggestionId, status: "MODIFICADA" });

        const updated = await suggestionRepo.getById(suggestionId);
        expect(updated?.status).toBe("MODIFICADA");
        expect(updated?.recipes).toEqual([{ recipeId: "r2", name: "Rice Bowl", position: 0 }]);
    });

    it("fails if suggestion is already accepted", async () => {
        const suggestion: PersistedSuggestion = {
            id: "s2",
            householdId: "home-1",
            date: "2026-02-03",
            slot: "CENA",
            status: "ACEPTADA",
            recipes: [{ recipeId: "r1", name: "Milk & Cereal", position: 0 }],
        };

        const suggestionRepo = new FakeSuggestionRepo([suggestion]);
        const recipeRepo = new FakeRecipeRepo(new Map([["home-1", []]]));

        const uc = new ModifySuggestionUseCase(suggestionRepo, recipeRepo);

        await expect(uc.execute({ suggestionId: "s2", recipeIds: ["r1"] })).rejects.toThrow(
            /already accepted/i
        );
    });
});
