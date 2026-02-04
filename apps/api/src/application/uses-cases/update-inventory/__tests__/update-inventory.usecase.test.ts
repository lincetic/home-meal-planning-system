import { describe, it, expect } from "vitest";
import { InventoryRepository } from "../../../ports/inventory-repository";
import { Inventory } from "../../../../domain/entities/inventory";
import { UpdateInventoryUseCase } from "../update-inventory.usecase";

class InMemoryInventoryRepository implements InventoryRepository {
    private store = new Map<string, Inventory>();

    async getByHouseholdId(householdId: string): Promise<Inventory | null> {
        return this.store.get(householdId) ?? null;
    }

    async save(householdId: string, inventory: Inventory): Promise<void> {
        this.store.set(householdId, inventory);
    }
}

describe("UpdateInventoryUseCase", () => {
    it("crea inventario si no existe y aplica ADD/CONSUME", async () => {
        const repo = new InMemoryInventoryRepository();
        const uc = new UpdateInventoryUseCase(repo);

        const out1 = await uc.execute({
            householdId: "home-1",
            operations: [
                { type: "ADD", ingredientId: "milk", amount: 2, expirationDate: "2026-02-05" },
                { type: "ADD", ingredientId: "rice", amount: 1 },
            ],
        });

        expect(out1.items.find((i) => i.ingredientId === "milk")!.quantity).toBe(2);
        expect(out1.items.find((i) => i.ingredientId === "rice")!.quantity).toBe(1);

        const out2 = await uc.execute({
            householdId: "home-1",
            operations: [{ type: "CONSUME", ingredientId: "milk", amount: 2 }],
        });

        // milk queda en 0 => se elimina
        expect(out2.items.some((i) => i.ingredientId === "milk")).toBe(false);
    });

    it("falla si intenta consumir ingrediente inexistente", async () => {
        const repo = new InMemoryInventoryRepository();
        const uc = new UpdateInventoryUseCase(repo);

        await expect(
            uc.execute({
                householdId: "home-1",
                operations: [{ type: "CONSUME", ingredientId: "tomato", amount: 1 }],
            })
        ).rejects.toThrow();
    });
});
