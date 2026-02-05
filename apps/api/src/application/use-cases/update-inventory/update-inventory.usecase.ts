import { InventoryRepository } from "../../ports/inventory-repository";
import { Inventory } from "../../../domain/entities/inventory";
import { Quantity } from "../../../domain/value-objects/quantity";
import {
    UpdateInventoryInput,
    UpdateInventoryOutput,
} from "./update-inventory.dto";

export class UpdateInventoryUseCase {
    constructor(private readonly inventoryRepo: InventoryRepository) { }

    async execute(input: UpdateInventoryInput): Promise<UpdateInventoryOutput> {
        const existing = await this.inventoryRepo.getByHouseholdId(input.householdId);
        const inventory = existing ?? new Inventory();

        for (const op of input.operations) {
            if (op.type === "ADD") {
                const q = Quantity.create(op.amount);
                const exp = op.expirationDate ? new Date(op.expirationDate) : undefined;
                inventory.addIngredient(op.ingredientId, q, exp);
            }

            if (op.type === "CONSUME") {
                const q = Quantity.create(op.amount);
                inventory.consumeIngredient(op.ingredientId, q);
            }
        }

        await this.inventoryRepo.save(input.householdId, inventory);

        return {
            householdId: input.householdId,
            items: inventory.getItems().map((i) => ({
                ingredientId: i.getIngredientId(),
                quantity: i.getQuantity().getValue(),
                expirationDate: i.getExpirationDate()
                    ? i.getExpirationDate()!.toISOString().slice(0, 10)
                    : undefined,
            })),
        };
    }
}
