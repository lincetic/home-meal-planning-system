import { Inventory } from "../../../domain/entities/inventory";
import { InventoryRepository } from "../../ports/inventory-repository";
import { RecipeRepository } from "../../ports/recipe-repository";
import { SuggestionRepository } from "../../ports/suggestion-repository";
import { GenerateAndStoreDailySuggestionUseCase } from "../generate-and-store-daily-suggestion/generate-and-store-daily-suggestion.usecase";

type MealSlot = "DESAYUNO" | "COMIDA" | "CENA";

export class GetCookingPlanUseCase {
    constructor(
        private readonly inventoryRepo: InventoryRepository,
        private readonly recipeRepo: RecipeRepository,
        private readonly suggestionRepo: SuggestionRepository,
        private readonly generateAndStoreSuggestionUC: GenerateAndStoreDailySuggestionUseCase
    ) { }

    async execute(input: {
        householdId: string;
        date: string; // YYYY-MM-DD
        slot: MealSlot;
        maxSuggestions?: number;
    }) {
        // 0) If there is already an accepted suggestion for this day+slot, return it
        const existing = await this.suggestionRepo.getDailySuggestion(
            input.householdId,
            input.date,
            input.slot
        );

        if (existing && existing.status === "ACEPTADA") {
            const acceptedId =
                typeof (existing as any).acceptedRecipeId === "string" &&
                    (existing as any).acceptedRecipeId.trim().length > 0
                    ? ((existing as any).acceptedRecipeId as string)
                    : null;

            // Si está ACEPTADA, acceptedRecipeId es obligatorio.
            // No hagas fallback a la primera receta porque eso "miente" y marca Milk.
            if (!acceptedId) {
                throw new Error("Accepted suggestion is missing acceptedRecipeId");
            }

            // Normaliza recipes a [{recipeId,name,position}]
            const sorted = existing.recipes.slice().sort((a, b) => a.position - b.position);

            // acceptedRecipeId debe estar dentro de recipes
            const exists = sorted.some((r) => r.recipeId === acceptedId);
            if (!exists) {
                throw new Error("Accepted recipeId not found among stored suggestion recipes");
            }

            return {
                kind: "SUGGESTION" as const,
                suggestionId: existing.id,
                status: existing.status,
                householdId: existing.householdId,
                date: existing.date,
                slot: existing.slot,
                acceptedRecipeId: acceptedId,
                recipes: sorted.map((r, idx) => ({
                    recipeId: r.recipeId,
                    name: r.name,
                    position: typeof r.position === "number" ? r.position : idx,
                })),
            };
        }


        // 1) Load inventory
        const inventory = await this.inventoryRepo.getByHouseholdId(input.householdId);
        const inv = inventory ?? new Inventory(); // inventario vacío

        // 2) Load recipes
        const recipes = await this.recipeRepo.listByHouseholdId(input.householdId);
        if (recipes.length === 0) throw new Error("No recipes available");

        // 3) Determine cookable recipes based on current inventory
        const cookable = recipes.filter((r) =>
            r.getIngredients().every((ing) => {
                const have = inv.getItem(ing.ingredientId)?.getQuantity().getValue() ?? 0;
                const need = ing.amount.getValue();
                return have >= need;
            })
        );

        // 4) If cookable exists -> generate/upsert stored suggestion and return
        if (cookable.length > 0) {
            const persisted = await this.generateAndStoreSuggestionUC.execute({
                householdId: input.householdId,
                date: input.date,
                slot: input.slot,
                maxSuggestions: input.maxSuggestions ?? 3,
            });

            return {
                kind: "SUGGESTION" as const,
                suggestionId: persisted.id,
                status: persisted.status,
                householdId: persisted.householdId,
                date: persisted.date,
                slot: persisted.slot,
                acceptedRecipeId: (persisted as any).acceptedRecipeId ?? null,
                recipes: persisted.recipes,
            };

        }

        // 5) No cookable -> choose best candidate (minimal missing)
        let best: {
            recipeId: string;
            name: string;
            missingCount: number;
            missingTotal: number;
            missing: Array<{ ingredientId: string; missingAmount: number }>;
        } | null = null;

        for (const r of recipes) {
            const missing: Array<{ ingredientId: string; missingAmount: number }> = [];

            for (const ing of r.getIngredients()) {
                const have = inv.getItem(ing.ingredientId)?.getQuantity().getValue() ?? 0;
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

        if (!best) throw new Error("No recipes available");

        return {
            kind: "NEEDS_SHOPPING" as const,
            householdId: input.householdId,
            date: input.date,
            slot: input.slot,
            targetRecipe: { recipeId: best.recipeId, name: best.name },
            shoppingList: { items: best.missing },
        };
    }
}