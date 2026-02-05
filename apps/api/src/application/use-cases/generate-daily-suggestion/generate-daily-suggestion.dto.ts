export interface GenerateDailySuggestionInput {
    householdId: string;
    date: string; // YYYY-MM-DD
    slot: "DESAYUNO" | "COMIDA" | "CENA";
    maxSuggestions?: number; // default 3
    expiringDaysThreshold?: number; // default 3
}

export interface GenerateDailySuggestionOutput {
    householdId: string;
    date: string;
    slot: "DESAYUNO" | "COMIDA" | "CENA";
    recipes: Array<{
        recipeId: string;
        name: string;
    }>;
    // Para el MVP: explicamos por qué se eligió (ayuda TFM)
    reasoning: {
        usedExpiringIngredients: string[];
        totalCandidateRecipes: number;
    };
}
