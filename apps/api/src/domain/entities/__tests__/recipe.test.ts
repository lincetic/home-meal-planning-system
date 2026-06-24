import { describe, it, expect } from "vitest";
import { Recipe } from "../recipe";
import { Quantity } from "../../value-objects/quantity";
import { RecipePortion } from "../../value-objects/recipe-portion";

describe("Recipe", () => {
    it("crea una receta válida", () => {
        const r = new Recipe("r1", "Rice Bowl", [
            { ingredientId: "rice", amount: Quantity.create(1) },
        ]);
        expect(r.getName()).toBe("Rice Bowl");
        expect(r.getIngredients().length).toBe(1);
    });

    it("falla si no tiene ingredientes", () => {
        expect(() => new Recipe("r1", "X", [])).toThrow();
    });

    it("falla si no tiene id", () => {
        expect(() => new Recipe("", "X", [{ ingredientId: "rice", amount: Quantity.create(1) }])).toThrow();
    });

    it("falla si no tiene nombre", () => {
        expect(() => new Recipe("r1", "", [{ ingredientId: "rice", amount: Quantity.create(1) }])).toThrow();
    });

    it("returns full ingredient requirements", () => {
        const recipe = new Recipe("r1", "Rice Bowl", [
            { ingredientId: "rice", amount: Quantity.create(2) },
        ]);

        const requirements = recipe.getRequirementsFor(RecipePortion.create("FULL"));

        expect(requirements[0].amount.getValue()).toBe(2);
    });

    it("returns half ingredient requirements", () => {
        const recipe = new Recipe("r1", "Rice Bowl", [
            { ingredientId: "rice", amount: Quantity.create(2) },
        ]);

        const requirements = recipe.getRequirementsFor(RecipePortion.create("HALF"));

        expect(requirements[0].amount.getValue()).toBe(1);
    });

    it("does not mutate original ingredient quantities when calculating a half portion", () => {
        const recipe = new Recipe("r1", "Rice Bowl", [
            { ingredientId: "rice", amount: Quantity.create(2) },
        ]);

        recipe.getRequirementsFor(RecipePortion.create("HALF"));

        expect(recipe.getRequirementsFor(RecipePortion.create("FULL"))[0].amount.getValue()).toBe(2);
        expect(recipe.getIngredients()[0].amount.getValue()).toBe(2);
    });
});
