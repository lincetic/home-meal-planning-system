import { InventoryRepository } from "../../ports/inventory-repository";
import {
    GenerateShoppingListInput,
    GenerateShoppingListOutput,
} from "./generate-shopping-list.dto";

export class GenerateShoppingListUseCase {
    constructor(private readonly inventoryRepo: InventoryRepository) { }

    async execute(
        input: GenerateShoppingListInput
    ): Promise<GenerateShoppingListOutput> {
        const inventory = await this.inventoryRepo.getByHouseholdId(input.householdId);
        if (!inventory) {
            throw new Error("Inventory not found");
        }

        const required = new Map<string, number>();

        // 1) acumular ingredientes requeridos por recetas
        for (const recipe of input.recipes) {
            for (const ing of recipe.ingredients) {
                required.set(
                    ing.ingredientId,
                    (required.get(ing.ingredientId) ?? 0) + ing.amount
                );
            }
        }

        // 2) comparar contra inventario
        const result: GenerateShoppingListOutput["items"] = [];

        for (const [ingredientId, requiredAmount] of required.entries()) {
            const invItem = inventory.getItem(ingredientId);
            const available = invItem ? invItem.getQuantity().getValue() : 0;

            if (available < requiredAmount) {
                result.push({
                    ingredientId,
                    missingAmount: requiredAmount - available,
                });
            }
        }

        return {
            householdId: input.householdId,
            items: result,
        };
    }
}
