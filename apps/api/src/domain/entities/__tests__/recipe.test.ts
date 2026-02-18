import { describe, it, expect } from "vitest";
import { Recipe } from "../recipe";
import { Quantity } from "../../value-objects/quantity";

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
});
