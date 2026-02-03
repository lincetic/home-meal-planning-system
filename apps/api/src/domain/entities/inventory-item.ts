import { Quantity } from "../value-objects/quantity";

/**
 * Entidad: InventoryItem
 * Representa un ingrediente dentro del inventario.
 */
export class InventoryItem {
    private readonly ingredientId: string;
    private quantity: Quantity;
    private readonly expirationDate?: Date;

    constructor(
        ingredientId: string,
        quantity: Quantity,
        expirationDate?: Date
    ) {
        if (!ingredientId) {
            throw new Error("ingredientId is required");
        }

        this.ingredientId = ingredientId;
        this.quantity = quantity;
        this.expirationDate = expirationDate;
    }

    getIngredientId(): string {
        return this.ingredientId;
    }

    getQuantity(): Quantity {
        return this.quantity;
    }

    getExpirationDate(): Date | undefined {
        return this.expirationDate;
    }

    /**
     * Consume una cantidad del item
     */
    consume(amount: Quantity): void {
        this.quantity = this.quantity.subtract(amount);
    }

    /**
     * Añade cantidad al item
     */
    add(amount: Quantity): void {
        this.quantity = this.quantity.add(amount);
    }

    /**
     * Indica si el item está próximo a caducar
     */
    isExpiringSoon(referenceDate: Date, daysThreshold: number = 3): boolean {
        if (!this.expirationDate) {
            return false;
        }

        const diffTime =
            this.expirationDate.getTime() - referenceDate.getTime();

        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        return diffDays <= daysThreshold;
    }
}
