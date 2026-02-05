import { Quantity } from "../value-objects/quantity";

export type RecipeIngredient = {
    ingredientId: string;
    amount: Quantity;
};

export class Recipe {
    private readonly id: string;
    private readonly name: string;
    private readonly ingredients: RecipeIngredient[];

    constructor(id: string, name: string, ingredients: RecipeIngredient[]) {
        if (!id) throw new Error("recipe id is required");
        if (!name) throw new Error("recipe name is required");
        if (ingredients.length === 0) throw new Error("recipe must have ingredients");

        this.id = id;
        this.name = name;
        this.ingredients = ingredients;
    }

    getId(): string {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getIngredients(): RecipeIngredient[] {
        return this.ingredients;
    }
}
