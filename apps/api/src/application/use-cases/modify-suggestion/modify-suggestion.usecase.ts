import { RecipeRepository } from "../../ports/recipe-repository";
import { SuggestionRepository } from "../../ports/suggestion-repository";
import { ModifySuggestionInput, ModifySuggestionOutput } from "./modify-suggestion.dto";

export class ModifySuggestionUseCase {
    constructor(
        private readonly suggestionRepo: SuggestionRepository,
        private readonly recipeRepo: RecipeRepository
    ) { }

    async execute(input: ModifySuggestionInput): Promise<ModifySuggestionOutput> {
        const suggestion = await this.suggestionRepo.getById(input.suggestionId);
        if (!suggestion) throw new Error("Suggestion not found");

        // MVP rule: once accepted, it cannot be modified
        if (suggestion.status === "ACEPTADA") {
            throw new Error("Suggestion already accepted");
        }

        const recipes = await this.recipeRepo.getByIds(
            suggestion.householdId,
            input.recipeIds
        );

        // Ensure all recipeIds exist
        if (recipes.length !== input.recipeIds.length) {
            throw new Error("Some recipes were not found");
        }

        // Persist: overwrite recipes + set status MODIFICADA
        await this.suggestionRepo.upsertDailySuggestion({
            householdId: suggestion.householdId,
            date: suggestion.date,
            slot: suggestion.slot,
            status: "MODIFICADA",
            recipes: input.recipeIds.map((id, idx) => {
                const r = recipes.find((x) => x.getId() === id)!;
                return { recipeId: r.getId(), name: r.getName(), position: idx };
            }),
        });

        return { suggestionId: suggestion.id, status: "MODIFICADA" };
    }
}
