export interface GenerateShoppingListFromRecipesInput {
    householdId: string;
    recipeIds: string[];
}

export interface GenerateShoppingListFromRecipesOutput {
    householdId: string;
    items: Array<{
        ingredientId: string;
        missingAmount: number;
    }>;
}
