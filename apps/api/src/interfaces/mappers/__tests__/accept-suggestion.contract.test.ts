import { describe, expect, it } from "vitest";
import {
    zAcceptSuggestionRequest,
    zAcceptSuggestionResponse,
    zGetCookingPlanResponse,
} from "@tfm/contracts";

const suggestionId = "11111111-1111-4111-8111-111111111111";
const recipeId = "22222222-2222-4222-8222-222222222222";
const householdId = "33333333-3333-4333-8333-333333333333";

describe("partial recipe consumption contracts", () => {
    it("accepts an omitted portion or a supported portion", () => {
        expect(zAcceptSuggestionRequest.safeParse({ suggestionId, recipeId }).success).toBe(true);
        expect(
            zAcceptSuggestionRequest.safeParse({ suggestionId, recipeId, portion: "HALF" }).success
        ).toBe(true);
    });

    it("rejects an unsupported portion", () => {
        expect(
            zAcceptSuggestionRequest.safeParse({ suggestionId, recipeId, portion: "QUARTER" })
                .success
        ).toBe(false);
    });

    it("requires the accepted recipe and portion in the acceptance response", () => {
        const result = zAcceptSuggestionResponse.safeParse({
            suggestionId,
            status: "ACEPTADA",
            acceptedRecipeId: recipeId,
            acceptedPortion: "HALF",
        });

        expect(result.success).toBe(true);
    });

    it("supports the accepted portion in an accepted cooking plan", () => {
        const result = zGetCookingPlanResponse.safeParse({
            kind: "ACCEPTED",
            suggestionId,
            status: "ACEPTADA",
            householdId,
            date: "2026-06-24",
            slot: "COMIDA",
            acceptedRecipe: {
                recipeId,
                name: "Rice Bowl",
            },
            acceptedPortion: "HALF",
            alternatives: [],
        });

        expect(result.success).toBe(true);
    });
});
