import { InventoryRepository } from "../../../application/ports/inventory-repository";
import { Inventory } from "../../../domain/entities/inventory";
import { InventoryItem } from "../../../domain/entities/inventory-item";
import { Quantity } from "../../../domain/value-objects/quantity";
import { prisma } from "./prisma-client";

export class PrismaInventoryRepository implements InventoryRepository {
    async getByHouseholdId(householdId: string): Promise<Inventory | null> {
        const household = await prisma.household.findUnique({
            where: { id: householdId },
            include: { items: true },
        });

        if (!household) return null;

        const items = household.items.map(
            (it) =>
                new InventoryItem(
                    it.ingredientId,
                    Quantity.create(it.quantity),
                    it.expirationDate ?? undefined
                )
        );

        return new Inventory(items);
    }

    async save(householdId: string, inventory: Inventory): Promise<void> {
        await prisma.household.upsert({
            where: { id: householdId },
            create: { id: householdId },
            update: {},
        });

        // Estrategia MVP: “replace all”
        // (Sencilla y correcta para empezar; luego optimizamos con diffs.)
        await prisma.inventoryItem.deleteMany({ where: { householdId } });

        const items = inventory.getItems();
        if (items.length === 0) return;

        await prisma.inventoryItem.createMany({
            data: items.map((i) => ({
                householdId,
                ingredientId: i.getIngredientId(),
                quantity: i.getQuantity().getValue(),
                expirationDate: i.getExpirationDate() ?? null,
            })),
        });
    }
}
