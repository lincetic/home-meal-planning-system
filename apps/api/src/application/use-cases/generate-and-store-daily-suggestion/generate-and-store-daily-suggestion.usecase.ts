import { GenerateDailySuggestionUseCase } from "../generate-daily-suggestion/generate-daily-suggestion.usecase";
import { GenerateDailySuggestionInput } from "../generate-daily-suggestion/generate-daily-suggestion.dto";
import { SuggestionRepository } from "../../ports/suggestion-repository";

export class GenerateAndStoreDailySuggestionUseCase {
    constructor(
        private readonly generator: GenerateDailySuggestionUseCase,
        private readonly suggestionRepo: SuggestionRepository
    ) { }

    async execute(input: GenerateDailySuggestionInput) {
        // 0) If there is already an accepted suggestion for the same day+slot,
        // we must NOT overwrite it (otherwise the user "loses" what was accepted).
        const existing = await this.suggestionRepo.getDailySuggestion(
            input.householdId,
            input.date,
            input.slot
        );

        if (existing && existing.status === "ACEPTADA") {
            return existing;
        }

        // 1) Generate a fresh suggestion from current inventory/recipes
        const generated = await this.generator.execute(input);

        // 2) Persist it (upsert for same household+date+slot)
        // If there was an existing suggestion (PROPUESTA/MODIFICADA) we keep its acceptedRecipeId (normally null).
        const persisted = await this.suggestionRepo.upsertDailySuggestion({
            householdId: generated.householdId,
            date: generated.date,
            slot: generated.slot,
            status: "PROPUESTA",
            acceptedRecipeId: existing?.acceptedRecipeId ?? null,
            recipes: generated.recipes.map((r, idx) => ({
                recipeId: r.recipeId,
                name: r.name,
                position: idx,
            })),
        });

        return persisted;
    }
}