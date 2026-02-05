import { RecipeRepository } from "../../../application/ports/recipe-repository";
import { Recipe } from "../../../domain/entities/recipe";
import { Quantity } from "../../../domain/value-objects/quantity";

export class InMemoryRecipeRepository implements RecipeRepository {
    private store = new Map<string, Recipe[]>();

    constructor() {
        // Seed MVP (puedes moverlo después a un seeder)
        this.store.set("default", [
            new Recipe("r1", "Rice Bowl", [
                { ingredientId: "rice", amount: Quantity.create(1) },
            ]),
            new Recipe("r2", "Omelette", [
                { ingredientId: "eggs", amount: Quantity.create(2) },
            ]),
            new Recipe("r3", "Milk & Cereal", [
                { ingredientId: "milk", amount: Quantity.create(1) },
            ]),
        ]);
    }

    async listByHouseholdId(householdId: string): Promise<Recipe[]> {
        return this.store.get(householdId) ?? this.store.get("default") ?? [];
    }
}
