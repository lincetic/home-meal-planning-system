import { InventoryRepository } from "../../ports/inventory-repository";

export class GetInventoryUseCase {
    constructor(private readonly inventoryRepo: InventoryRepository) { }

    async execute(input: { householdId: string }): Promise<{
        householdId: string;
        items: Array<{ ingredientId: string; quantity: number; expirationDate: string | null }>;
    }> {
        const inventory = await this.inventoryRepo.getByHouseholdId(input.householdId);

        if (!inventory) {
            return { householdId: input.householdId, items: [] };
        }

        const items = inventory.getItems().map((it) => {
            const exp = it.getExpirationDate(); // Date | undefined
            return {
                ingredientId: it.getIngredientId(),
                quantity: it.getQuantity().getValue(), // number
                expirationDate: exp ? exp.toISOString().slice(0, 10) : null, // string | null
            };
        });

        return { householdId: input.householdId, items };
    }
}
