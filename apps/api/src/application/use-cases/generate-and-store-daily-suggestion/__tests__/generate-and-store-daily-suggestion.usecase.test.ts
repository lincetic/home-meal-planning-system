import { describe, expect, it } from "vitest";
import { GenerateAndStoreDailySuggestionUseCase } from "../generate-and-store-daily-suggestion.usecase";
import { GenerateDailySuggestionUseCase } from "../../generate-daily-suggestion/generate-daily-suggestion.usecase";
import type {
    PersistedSuggestion,
    SuggestionRepository,
    SuggestionStatus,
} from "../../../ports/suggestion-repository";

class FakeSuggestionRepo implements SuggestionRepository {
    public lastUpsertInput: Omit<PersistedSuggestion, "id"> | null = null;

    async upsertDailySuggestion(data: Omit<PersistedSuggestion, "id">): Promise<PersistedSuggestion> {
        this.lastUpsertInput = data;
        return {
            id: "sug-1",
            ...data,
        };
    }

    async getDailySuggestion(): Promise<PersistedSuggestion | null> {
        throw new Error("not needed");
    }

    async setStatus(_: string, __: SuggestionStatus): Promise<void> {
        throw new Error("not needed");
    }

    async getById(): Promise<PersistedSuggestion | null> {
        throw new Error("not needed");
    }
}

describe("GenerateAndStoreDailySuggestionUseCase", () => {
    it("generates suggestions and persists them as PROPUESTA with recipe positions", async () => {
        const generator = {
            execute: async () => ({
                householdId: "home-1",
                date: "2026-02-03",
                slot: "CENA" as const,
                recipes: [
                    { recipeId: "r2", name: "Rice Bowl" },
                    { recipeId: "r1", name: "Milk & Cereal" },
                ],
                reasoning: {
                    usedExpiringIngredients: ["milk"],
                    totalCandidateRecipes: 2,
                },
            }),
        } as GenerateDailySuggestionUseCase;

        const suggestionRepo = new FakeSuggestionRepo();
        const uc = new GenerateAndStoreDailySuggestionUseCase(generator, suggestionRepo);

        const out = await uc.execute({
            householdId: "home-1",
            date: "2026-02-03",
            slot: "CENA",
            maxSuggestions: 2,
        });

        expect(suggestionRepo.lastUpsertInput).toEqual({
            householdId: "home-1",
            date: "2026-02-03",
            slot: "CENA",
            status: "PROPUESTA",
            recipes: [
                { recipeId: "r2", name: "Rice Bowl", position: 0 },
                { recipeId: "r1", name: "Milk & Cereal", position: 1 },
            ],
        });
        expect(out.id).toBe("sug-1");
        expect(out.status).toBe("PROPUESTA");
    });
});
