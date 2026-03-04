import { GenerateDailySuggestionUseCase } from "../generate-daily-suggestion/generate-daily-suggestion.usecase";
import type { PersistedSuggestion, SuggestionRepository } from "../../ports/suggestion-repository";

type MealSlot = "DESAYUNO" | "COMIDA" | "CENA";

function clampMaxSuggestions(n?: number) {
    if (!n) return 3;
    return Math.max(1, Math.min(3, n));
}

export class GenerateAndStoreDailySuggestionUseCase {
    constructor(
        private readonly generator: GenerateDailySuggestionUseCase,
        private readonly suggestionRepo: SuggestionRepository
    ) { }

    async execute(input: {
        householdId: string;
        date: string; // YYYY-MM-DD
        slot: MealSlot;
        maxSuggestions?: number;
    }): Promise<PersistedSuggestion> {
        const maxSuggestions = clampMaxSuggestions(input.maxSuggestions);

        const generated = await this.generator.execute({
            householdId: input.householdId,
            date: input.date,
            slot: input.slot,
            maxSuggestions,
        });

        const picked = generated.recipes.slice(0, maxSuggestions);

        const persisted = await this.suggestionRepo.upsertDailySuggestion({
            householdId: generated.householdId,
            date: generated.date,
            slot: generated.slot,
            status: "PROPUESTA",
            acceptedRecipeId: null, // explicit on create/update flow
            recipes: picked.map((r, idx) => ({
                recipeId: r.recipeId,
                name: r.name,
                position: idx,
            })),
        });

        return persisted;
    }
}