import { GenerateDailySuggestionUseCase } from "../generate-daily-suggestion/generate-daily-suggestion.usecase";
import { GenerateDailySuggestionInput } from "../generate-daily-suggestion/generate-daily-suggestion.dto";
import { SuggestionRepository } from "../../ports/suggestion-repository";

export class GenerateAndStoreDailySuggestionUseCase {
    constructor(
        private readonly generator: GenerateDailySuggestionUseCase,
        private readonly suggestionRepo: SuggestionRepository
    ) { }

    async execute(input: GenerateDailySuggestionInput) {
        const generated = await this.generator.execute(input);

        const persisted = await this.suggestionRepo.upsertDailySuggestion({
            householdId: generated.householdId,
            date: generated.date,
            slot: generated.slot,
            status: "PROPUESTA",
            recipes: generated.recipes.map((r, idx) => ({
                recipeId: r.recipeId,
                name: r.name,
                position: idx,
            })),
        });

        return persisted;
    }
}
