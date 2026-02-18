import { Inventory } from "../../../domain/entities/inventory";
import { InventoryRepository } from "../../ports/inventory-repository";
import { RecipeRepository } from "../../ports/recipe-repository";
import { GenerateAndStoreDailySuggestionUseCase } from "../generate-and-store-daily-suggestion/generate-and-store-daily-suggestion.usecase";

export class GetCookingPlanUseCase {
    constructor(
        private readonly inventoryRepo: InventoryRepository,
        private readonly recipeRepo: RecipeRepository,
        private readonly generateAndStoreSuggestionUC: GenerateAndStoreDailySuggestionUseCase
    ) { }

    async execute(input: {
        householdId: string;
        date: string;
        slot: "DESAYUNO" | "COMIDA" | "CENA";
        maxSuggestions?: number;
    }) {
        const inventory = await this.inventoryRepo.getByHouseholdId(input.householdId);
        const inv = inventory ?? new Inventory(); // inventario vacío


        const recipes = await this.recipeRepo.listByHouseholdId(input.householdId);
        if (recipes.length === 0) throw new Error("No recipes available");

        // Cookable recipes
        const cookable = recipes.filter((r) =>
            r.getIngredients().every((ing) => {
                const have = inv?.getItem(ing.ingredientId)?.getQuantity().getValue() ?? 0;
                const need = ing.amount.getValue();
                return have >= need;
            })
        );

        if (cookable.length > 0) {
            const persisted = await this.generateAndStoreSuggestionUC.execute({
                householdId: input.householdId,
                date: input.date,
                slot: input.slot,
                maxSuggestions: input.maxSuggestions ?? 3,
            });

            return {
                kind: "SUGGESTION",
                suggestionId: persisted.id,
                status: persisted.status,
                householdId: persisted.householdId,
                date: persisted.date,
                slot: persisted.slot,
                recipes: persisted.recipes,
            };
        }

        // Find best candidate recipe (minimal missing)
        let best: any = null;

        for (const r of recipes) {
            const missing: Array<{ ingredientId: string; missingAmount: number }> = [];

            for (const ing of r.getIngredients()) {
                const have = inv?.getItem(ing.ingredientId)?.getQuantity().getValue() ?? 0;
                const need = ing.amount.getValue();
                if (have < need) missing.push({ ingredientId: ing.ingredientId, missingAmount: need - have });
            }

            const candidate = {
                recipeId: r.getId(),
                name: r.getName(),
                missingCount: missing.length,
                missingTotal: missing.reduce((s, x) => s + x.missingAmount, 0),
                missing,
            };

            if (!best) best = candidate;
            else if (
                candidate.missingCount < best.missingCount ||
                (candidate.missingCount === best.missingCount && candidate.missingTotal < best.missingTotal)
            ) {
                best = candidate;
            }
        }

        return {
            kind: "NEEDS_SHOPPING",
            householdId: input.householdId,
            date: input.date,
            slot: input.slot,
            targetRecipe: { recipeId: best.recipeId, name: best.name },
            shoppingList: { items: best.missing },
        };
    }
}
