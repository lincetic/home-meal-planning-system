import { Recipe } from "../../domain/entities/recipe";

export interface RecipeRepository {
    listByHouseholdId(householdId: string): Promise<Recipe[]>;
    getByIds(householdId: string, recipeIds: string[]): Promise<Recipe[]>;
}
