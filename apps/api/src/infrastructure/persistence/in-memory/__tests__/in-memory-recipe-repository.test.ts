import { describe, it, expect } from "vitest";
import { InMemoryRecipeRepository } from "../in-memory-recipe-repository";

describe("InMemoryRecipeRepository", () => {
    it("devuelve recetas por defecto si no hay del hogar", async () => {
        const repo = new InMemoryRecipeRepository();
        const recipes = await repo.listByHouseholdId("home-1");
        expect(recipes.length).toBeGreaterThan(0);
    });
});
