import { InventoryRepository } from "../../ports/inventory-repository";
import { RecipeRepository } from "../../ports/recipe-repository";
import { SuggestionRepository } from "../../ports/suggestion-repository";
import { RecipePortion } from "../../../domain/value-objects/recipe-portion";
import { AcceptSuggestionInput, AcceptSuggestionOutput } from "./accept-suggestion.dto";

export class AcceptSuggestionUseCase {
    constructor(
        private readonly suggestionRepo: SuggestionRepository,
        private readonly inventoryRepo: InventoryRepository,
        private readonly recipeRepo: RecipeRepository
    ) { }

    async execute(input: AcceptSuggestionInput): Promise<AcceptSuggestionOutput> {
        // 1) Load suggestion
        const suggestion = await (this.suggestionRepo as any).getById(input.suggestionId);
        if (!suggestion) throw new Error("Suggestion not found");

        // Idempotency
        if (suggestion.status === "ACEPTADA") {
            if (!suggestion.acceptedRecipeId) {
                throw new Error("Accepted suggestion has no accepted recipe");
            }

            return {
                suggestionId: suggestion.id,
                status: "ACEPTADA",
                acceptedRecipeId: suggestion.acceptedRecipeId,
                acceptedPortion: suggestion.acceptedPortion ?? "FULL",
            };
        }

        // 2) Decide which recipe to accept/consume
        const suggestedRecipes: Array<{ recipeId: string; position: number }> =
            (suggestion.recipes ?? []).map((r: any) => ({ recipeId: r.recipeId, position: r.position ?? 0 }));

        if (suggestedRecipes.length === 0) {
            throw new Error("Suggestion has no recipes");
        }

        let chosenRecipeId: string;

        if (input.recipeId) {
            const isInSuggestion = suggestedRecipes.some((r) => r.recipeId === input.recipeId);
            if (!isInSuggestion) throw new Error("Selected recipe is not part of the suggestion");
            chosenRecipeId = input.recipeId;
        } else {
            // Default: pick the lowest position
            chosenRecipeId = suggestedRecipes.slice().sort((a, b) => a.position - b.position)[0].recipeId;
        }

        // 3) Load inventory
        const inventory = await this.inventoryRepo.getByHouseholdId(suggestion.householdId);
        if (!inventory) throw new Error("Inventory not found");

        // 4) Load chosen recipe and consume
        const recipes = await this.recipeRepo.getByIds(suggestion.householdId, [chosenRecipeId]);
        const chosen = recipes[0];
        if (!chosen) throw new Error("Recipe not found");
        const portion = RecipePortion.create(input.portion ?? "FULL");
        const requirements = chosen.getRequirementsFor(portion);

        // 4.5) Validate inventory before consuming (prevents negative)
        for (const ing of requirements) {
            const have = inventory.getItem(ing.ingredientId)?.getQuantity().getValue() ?? 0;
            const need = ing.amount.getValue();
            if (have < need) {
                throw new Error(
                    `Not enough inventory for ingredient ${ing.ingredientId}: have ${have}, need ${need}`
                );
            }
        }

        for (const ing of requirements) {
            inventory.consumeIngredient(ing.ingredientId, ing.amount);
        }

        // 5) Persist inventory + set status accepted
        await this.inventoryRepo.save(suggestion.householdId, inventory);
        await this.suggestionRepo.setAcceptedRecipe(
            suggestion.id,
            chosenRecipeId,
            portion.getValue()
        );
        await this.suggestionRepo.setStatus(suggestion.id, "ACEPTADA");

        return {
            suggestionId: suggestion.id,
            status: "ACEPTADA",
            acceptedRecipeId: chosenRecipeId,
            acceptedPortion: portion.getValue(),
        };
    }
}
