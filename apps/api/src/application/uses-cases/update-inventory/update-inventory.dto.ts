export type UpdateInventoryOperation =
    | {
        type: "ADD";
        ingredientId: string;
        amount: number;
        expirationDate?: string; // YYYY-MM-DD
    }
    | {
        type: "CONSUME";
        ingredientId: string;
        amount: number;
    };

export interface UpdateInventoryInput {
    householdId: string;
    operations: UpdateInventoryOperation[];
}

export interface UpdateInventoryOutput {
    // Para el MVP devolvemos un snapshot simple
    householdId: string;
    items: Array<{
        ingredientId: string;
        quantity: number;
        expirationDate?: string;
    }>;
}
