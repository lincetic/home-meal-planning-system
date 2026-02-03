/**
 * Value Object: Quantity
 * Representa una cantidad válida dentro del dominio.
 */
export class Quantity {
    private readonly value: number;

    private constructor(value: number) {
        this.value = value;
    }

    /**
     * Factory method
     */
    static create(value: number): Quantity {
        if (value < 0) {
            throw new Error("Quantity cannot be negative");
        }

        return new Quantity(value);
    }

    /**
     * Obtiene el valor primitivo
     */
    getValue(): number {
        return this.value;
    }

    /**
     * Suma otra cantidad
     */
    add(other: Quantity): Quantity {
        return Quantity.create(this.value + other.value);
    }

    /**
     * Resta otra cantidad
     */
    subtract(other: Quantity): Quantity {
        const result = this.value - other.value;

        if (result < 0) {
            throw new Error("Resulting quantity cannot be negative");
        }

        return Quantity.create(result);
    }

    /**
     * Comparación
     */
    equals(other: Quantity): boolean {
        return this.value === other.value;
    }
}
