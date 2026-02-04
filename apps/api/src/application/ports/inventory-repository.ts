import { Inventory } from "../../domain/entities/inventory";

export interface InventoryRepository {
    getByHouseholdId(householdId: string): Promise<Inventory | null>;
    save(householdId: string, inventory: Inventory): Promise<void>;
}
