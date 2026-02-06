import { InventoryRepository } from "../../ports/inventory-repository";
import { RecipeRepository } from "../../ports/recipe-repository";
import {
    GenerateShoppingListFromRecipesInput,
    GenerateShoppingListFromRecipesOutput,
} from "./generate-shopping-list-from-recipes.dto";

export class GenerateShoppingListFromRecipesUseCase {
    constructor(
        private readonly inventoryRepo: InventoryRepository,
        private readonly recipeRepo: RecipeRepository
    ) { }

    async execute(
        input: GenerateShoppingListFromRecipesInput
    ): Promise<GenerateShoppingListFromRecipesOutput> {
        const inventory = await this.inventoryRepo.getByHouseholdId(input.householdId);
        if (!inventory) throw new Error("Inventory not found");

        const recipes = await this.recipeRepo.getByIds(input.householdId, input.recipeIds);

        // acumular required por ingrediente
        const required = new Map<string, number>();

        for (const r of recipes) {
            for (const ing of r.getIngredients()) {
                required.set(
                    ing.ingredientId,
                    (required.get(ing.ingredientId) ?? 0) + ing.amount.getValue()
                );
            }
        }

        // comparar contra inventario
        const items: GenerateShoppingListFromRecipesOutput["items"] = [];

        for (const [ingredientId, requiredAmount] of required.entries()) {
            const invItem = inventory.getItem(ingredientId);
            const available = invItem ? invItem.getQuantity().getValue() : 0;

            if (available < requiredAmount) {
                items.push({ ingredientId, missingAmount: requiredAmount - available });
            }
        }

        return { householdId: input.householdId, items };
    }
}
