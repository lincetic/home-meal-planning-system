import { beforeEach, describe, expect, it, vi } from "vitest";

const { mealSuggestion } = vi.hoisted(() => ({
    mealSuggestion: {
        findUnique: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
    },
}));

vi.mock("../prisma-client", () => ({
    prisma: { mealSuggestion },
}));

import { PrismaSuggestionRepository } from "../prisma-suggestion-repository";

describe("PrismaSuggestionRepository accepted portion", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("stores accepted recipe and portion together", async () => {
        mealSuggestion.update.mockResolvedValue({});
        const repository = new PrismaSuggestionRepository();

        await repository.setAcceptedRecipe("suggestion-1", "recipe-1", "HALF");

        expect(mealSuggestion.update).toHaveBeenCalledWith({
            where: { id: "suggestion-1" },
            data: {
                acceptedRecipeId: "recipe-1",
                acceptedPortion: "HALF",
            },
        });
    });

    it("reads a persisted accepted portion", async () => {
        mealSuggestion.findUnique.mockResolvedValue({
            id: "suggestion-1",
            householdId: "household-1",
            date: new Date("2026-06-24T00:00:00.000Z"),
            slot: "COMIDA",
            status: "ACEPTADA",
            acceptedRecipeId: "recipe-1",
            acceptedPortion: "HALF",
            recipes: [{
                recipeId: "recipe-1",
                recipeName: "Rice Bowl",
                position: 0,
            }],
        });
        const repository = new PrismaSuggestionRepository();

        const suggestion = await repository.getById("suggestion-1");

        expect(suggestion?.acceptedPortion).toBe("HALF");
    });

    it("treats a legacy accepted suggestion without a portion as full", async () => {
        mealSuggestion.findUnique.mockResolvedValue({
            id: "suggestion-legacy",
            householdId: "household-1",
            date: new Date("2026-06-24T00:00:00.000Z"),
            slot: "COMIDA",
            status: "ACEPTADA",
            acceptedRecipeId: "recipe-1",
            acceptedPortion: null,
            recipes: [{
                recipeId: "recipe-1",
                recipeName: "Rice Bowl",
                position: 0,
            }],
        });
        const repository = new PrismaSuggestionRepository();

        const suggestion = await repository.getById("suggestion-legacy");

        expect(suggestion?.acceptedPortion).toBe("FULL");
    });
});
