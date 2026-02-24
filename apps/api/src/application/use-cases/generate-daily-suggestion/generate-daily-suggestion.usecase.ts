import { Inventory } from "../../../domain/entities/inventory";
import { InventoryRepository } from "../../ports/inventory-repository";
import { RecipeRepository } from "../../ports/recipe-repository";
import { GenerateDailySuggestionInput, GenerateDailySuggestionOutput } from "./generate-daily-suggestion.dto";

export class GenerateDailySuggestionUseCase {
    constructor(
        private readonly inventoryRepo: InventoryRepository,
        private readonly recipeRepo: RecipeRepository
    ) { }

    async execute(input: GenerateDailySuggestionInput): Promise<GenerateDailySuggestionOutput> {
        const max = input.maxSuggestions ?? 3;
        const expDays = input.expiringDaysThreshold ?? 3;

        const inventory = (await this.inventoryRepo.getByHouseholdId(input.householdId)) ?? new Inventory();


        const recipes = await this.recipeRepo.listByHouseholdId(input.householdId);

        // 1) ingredientes próximos a caducar
        const refDate = new Date(input.date);
        const expiring = inventory.getExpiringSoon(refDate, expDays);
        const expiringIds = new Set(expiring.map((i) => i.getIngredientId()));

        // 2) filtrar recetas realmente cocinables (mismo criterio que el plan)
        const candidates = recipes.filter((r) =>
            r.getIngredients().every((ing) => {
                const have = inventory.getItem(ing.ingredientId)?.getQuantity().getValue() ?? 0;
                const need = ing.amount.getValue();
                return have >= need;
            })
        );


        // 3) scoring: +1 por cada ingrediente de la receta que esté próximo a caducar
        const scored = candidates
            .map((r) => {
                const usedExp = r.getIngredients()
                    .map((i) => i.ingredientId)
                    .filter((id) => expiringIds.has(id));
                return { r, score: usedExp.length, usedExp };
            })
            .sort((a, b) => b.score - a.score);

        const chosen = scored.slice(0, max);

        const usedExpiringIngredients = Array.from(
            new Set(chosen.flatMap((c) => c.usedExp))
        );

        return {
            householdId: input.householdId,
            date: input.date,
            slot: input.slot,
            recipes: chosen.map((c) => ({
                recipeId: c.r.getId(),
                name: c.r.getName(),
            })),
            reasoning: {
                usedExpiringIngredients,
                totalCandidateRecipes: candidates.length,
            },
        };
    }
}
