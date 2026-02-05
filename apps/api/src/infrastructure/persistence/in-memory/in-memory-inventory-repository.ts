import { InventoryRepository } from "../../../application/ports/inventory-repository";
import { Inventory } from "../../../domain/entities/inventory";

export class InMemoryInventoryRepository implements InventoryRepository {
    private store = new Map<string, Inventory>();

    async getByHouseholdId(householdId: string): Promise<Inventory | null> {
        return this.store.get(householdId) ?? null;
    }

    async save(householdId: string, inventory: Inventory): Promise<void> {
        this.store.set(householdId, inventory);
    }
}
