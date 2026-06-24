import { Inventory } from "../../../domain/entities/inventory";
import { InventoryRepository } from "../../ports/inventory-repository";
import { RecipeRepository } from "../../ports/recipe-repository";
import { SuggestionRepository } from "../../ports/suggestion-repository";
import { GenerateAndStoreDailySuggestionUseCase } from "../generate-and-store-daily-suggestion/generate-and-store-daily-suggestion.usecase";

type MealSlot = "DESAYUNO" | "COMIDA" | "CENA";

function normalizeAcceptedRecipeId(v: unknown): string | null {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
    return null;
}

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
        // 0) If there is already a persisted suggestion, reuse it
        const existing = await this.suggestionRepo.getDailySuggestion(
            input.householdId,
            input.date,
            input.slot
        );

        if (existing) {
            const sorted = existing.recipes.slice().sort((a, b) => a.position - b.position);

            // If DB says ACCEPTED but acceptedRecipeId is missing -> DB is inconsistent.
            // We "self-heal": downgrade to PROPUESTA and continue as a normal suggestion.
            if (existing.status === "ACEPTADA") {
                const acceptedId = normalizeAcceptedRecipeId((existing as any).acceptedRecipeId);

                // acceptedRecipeId must exist AND be part of recipes
                const acceptedExists = acceptedId
                    ? sorted.some((r) => r.recipeId === acceptedId)
                    : false;

                if (!acceptedId || !acceptedExists) {
                    // Repair status so it doesn't keep failing forever.
                    // We don't lie by picking a recipe; we simply mark it as not accepted.
                    await this.suggestionRepo.setStatus(existing.id, "PROPUESTA" as any);

                    return {
                        kind: "SUGGESTION" as const,
                        suggestionId: existing.id,
                        status: "PROPUESTA" as const,
                        householdId: existing.householdId,
                        date: existing.date,
                        slot: existing.slot,
                        acceptedRecipeId: null,
                        recipes: sorted.map((r, idx) => ({
                            recipeId: r.recipeId,
                            name: r.name,
                            position: typeof r.position === "number" ? r.position : idx,
                        })),
                    };
                }

                // Accepted and consistent -> return suggestion with acceptedRecipeId
                return {
                    kind: "SUGGESTION" as const,
                    suggestionId: existing.id,
                    status: existing.status,
                    householdId: existing.householdId,
                    date: existing.date,
                    slot: existing.slot,
                    acceptedRecipeId: acceptedId,
                    acceptedPortion: existing.acceptedPortion ?? "FULL",
                    recipes: sorted.map((r, idx) => ({
                        recipeId: r.recipeId,
                        name: r.name,
                        position: typeof r.position === "number" ? r.position : idx,
                    })),
                };
            }

            // Not accepted -> return as-is (persisted suggestion)
            return {
                kind: "SUGGESTION" as const,
                suggestionId: existing.id,
                status: existing.status,
                householdId: existing.householdId,
                date: existing.date,
                slot: existing.slot,
                acceptedRecipeId: normalizeAcceptedRecipeId((existing as any).acceptedRecipeId),
                acceptedPortion: existing.acceptedPortion ?? null,
                recipes: sorted.map((r, idx) => ({
                    recipeId: r.recipeId,
                    name: r.name,
                    position: typeof r.position === "number" ? r.position : idx,
                })),
            };
        }

        // 1) Load inventory
        const inventory = await this.inventoryRepo.getByHouseholdId(input.householdId);
        const inv = inventory ?? new Inventory();

        // 2) Load recipes
        const recipes = await this.recipeRepo.listByHouseholdId(input.householdId);
        if (recipes.length === 0) throw new Error("No recipes available");

        // 3) Cookable recipes
        const cookable = recipes.filter((r) =>
            r.getIngredients().every((ing) => {
                const have = inv.getItem(ing.ingredientId)?.getQuantity().getValue() ?? 0;
                const need = ing.amount.getValue();
                return have >= need;
            })
        );

        // 4) Cookable exists -> generate and store suggestion
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
                acceptedRecipeId: normalizeAcceptedRecipeId((persisted as any).acceptedRecipeId),
                acceptedPortion: persisted.acceptedPortion ?? null,
                recipes: persisted.recipes,
            };
        }

        // 5) No cookable -> minimal shopping list
        let best:
            | {
                recipeId: string;
                name: string;
                missingCount: number;
                missingTotal: number;
                missing: Array<{ ingredientId: string; missingAmount: number }>;
            }
            | null = null;

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
