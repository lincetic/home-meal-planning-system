import { InventoryRepository } from "../../ports/inventory-repository";
import { RecipeRepository } from "../../ports/recipe-repository";
import { SuggestionRepository } from "../../ports/suggestion-repository";
import { AcceptSuggestionInput, AcceptSuggestionOutput } from "./accept-suggestion.dto";

export class AcceptSuggestionUseCase {
    constructor(
        private readonly suggestionRepo: SuggestionRepository,
        private readonly inventoryRepo: InventoryRepository,
        private readonly recipeRepo: RecipeRepository
    ) { }

    async execute(input: AcceptSuggestionInput): Promise<AcceptSuggestionOutput> {
        // 1) Load suggestion
        // We need a method to get by id. We'll add it now.
        const suggestion = await (this.suggestionRepo as any).getById(input.suggestionId);
        if (!suggestion) throw new Error("Suggestion not found");

        if (suggestion.status === "ACEPTADA") {
            return { suggestionId: suggestion.id, status: "ACEPTADA" };
        }

        // 2) Load inventory
        const inventory = await this.inventoryRepo.getByHouseholdId(suggestion.householdId);
        if (!inventory) throw new Error("Inventory not found");

        // 3) Load recipes and consume
        const recipeIds = suggestion.recipes.map((r: any) => r.recipeId);
        const recipes = await this.recipeRepo.getByIds(suggestion.householdId, recipeIds);

        // Consume each recipe ingredient
        for (const recipe of recipes) {
            for (const ing of recipe.getIngredients()) {
                inventory.consumeIngredient(ing.ingredientId, ing.amount);
            }
        }

        // 4) Persist inventory + set status accepted
        await this.inventoryRepo.save(suggestion.householdId, inventory);
        await this.suggestionRepo.setStatus(suggestion.id, "ACEPTADA");

        return { suggestionId: suggestion.id, status: "ACEPTADA" };
    }
}
