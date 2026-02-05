export interface GenerateShoppingListInput {
    householdId: string;
    recipes: Array<{
        recipeId: string;
        ingredients: Array<{
            ingredientId: string;
            amount: number;
        }>;
    }>;
}

export interface GenerateShoppingListOutput {
    householdId: string;
    items: Array<{
        ingredientId: string;
        missingAmount: number;
    }>;
}
