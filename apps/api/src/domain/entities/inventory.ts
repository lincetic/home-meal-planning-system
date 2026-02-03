import { InventoryItem } from "./inventory-item";
import { Quantity } from "../value-objects/quantity";

/**
 * Entidad / Aggregate Root: Inventory
 * Controla la consistencia de los InventoryItem del hogar.
 */
export class Inventory {
    private readonly items: Map<string, InventoryItem>;

    constructor(initialItems: InventoryItem[] = []) {
        this.items = new Map();

        // Regla: no duplicados por ingredientId
        for (const item of initialItems) {
            this.addOrMergeItem(item);
        }
    }

    /**
     * Devuelve los items como array (solo lectura desde fuera)
     */
    getItems(): InventoryItem[] {
        return Array.from(this.items.values());
    }

    /**
     * Obtiene un item por ingredientId
     */
    getItem(ingredientId: string): InventoryItem | undefined {
        return this.items.get(ingredientId);
    }

    /**
     * Añade un item nuevo o suma la cantidad si ya existe.
     * (Regla del agregado: 1 item por ingrediente)
     */
    addIngredient(
        ingredientId: string,
        amount: Quantity,
        expirationDate?: Date
    ): void {
        const existing = this.items.get(ingredientId);

        if (!existing) {
            this.items.set(
                ingredientId,
                new InventoryItem(ingredientId, amount, expirationDate)
            );
            return;
        }

        existing.add(amount);

        // MVP: si llega una caducidad y el item no tenía, la ponemos.
        // Si ya tenía, lo dejamos como está (más adelante se soportarán lotes).
        if (!existing.getExpirationDate() && expirationDate) {
            // Hack MVP: recrear item con misma cantidad pero nueva fecha.
            // (Más adelante modelaremos lotes para múltiples caducidades)
            const updated = new InventoryItem(
                ingredientId,
                existing.getQuantity(),
                expirationDate
            );
            this.items.set(ingredientId, updated);
        }
    }

    /**
     * Consume cantidad de un ingrediente. Si queda en 0, lo eliminamos.
     */
    consumeIngredient(ingredientId: string, amount: Quantity): void {
        const existing = this.items.get(ingredientId);

        if (!existing) {
            throw new Error("Ingredient not found in inventory");
        }

        existing.consume(amount);

        if (existing.getQuantity().getValue() === 0) {
            this.items.delete(ingredientId);
        }
    }

    /**
     * Devuelve items próximos a caducar (por defecto, <= 3 días)
     */
    getExpiringSoon(referenceDate: Date, daysThreshold: number = 3): InventoryItem[] {
        return this.getItems().filter((i) => i.isExpiringSoon(referenceDate, daysThreshold));
    }

    /**
     * Helper interno para mergear items evitando duplicados
     */
    private addOrMergeItem(item: InventoryItem): void {
        const existing = this.items.get(item.getIngredientId());

        if (!existing) {
            this.items.set(item.getIngredientId(), item);
            return;
        }

        existing.add(item.getQuantity());

        // MVP: si existing no tiene caducidad y el nuevo sí, la tomamos
        if (!existing.getExpirationDate() && item.getExpirationDate()) {
            const updated = new InventoryItem(
                item.getIngredientId(),
                existing.getQuantity(),
                item.getExpirationDate()
            );
            this.items.set(item.getIngredientId(), updated);
        }
    }
}
