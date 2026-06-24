import { describe, expect, it } from "vitest";
import {
    toAcceptSuggestionInput,
    toAcceptSuggestionResponse,
} from "../accept-suggestion.mapper";

describe("accept suggestion mapper", () => {
    it("maps a half portion request to the use-case input", () => {
        expect(toAcceptSuggestionInput({
            suggestionId: "11111111-1111-4111-8111-111111111111",
            recipeId: "22222222-2222-4222-8222-222222222222",
            portion: "HALF",
        })).toEqual({
            suggestionId: "11111111-1111-4111-8111-111111111111",
            recipeId: "22222222-2222-4222-8222-222222222222",
            portion: "HALF",
        });
    });

    it("maps the accepted decision to the HTTP response", () => {
        expect(toAcceptSuggestionResponse({
            suggestionId: "11111111-1111-4111-8111-111111111111",
            status: "ACEPTADA",
            acceptedRecipeId: "22222222-2222-4222-8222-222222222222",
            acceptedPortion: "HALF",
        })).toEqual({
            suggestionId: "11111111-1111-4111-8111-111111111111",
            status: "ACEPTADA",
            acceptedRecipeId: "22222222-2222-4222-8222-222222222222",
            acceptedPortion: "HALF",
        });
    });
});
