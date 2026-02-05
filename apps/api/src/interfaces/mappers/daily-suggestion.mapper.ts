import {
    GenerateDailySuggestionRequest,
    GenerateDailySuggestionResponse,
} from "@tfm/contracts";

import {
    GenerateDailySuggestionInput,
    GenerateDailySuggestionOutput,
} from "../../application/use-cases/generate-daily-suggestion/generate-daily-suggestion.dto";

export function toGenerateDailySuggestionInput(
    req: GenerateDailySuggestionRequest
): GenerateDailySuggestionInput {
    return {
        householdId: req.householdId,
        date: req.date,
        slot: req.slot,
        maxSuggestions: req.maxSuggestions,
        expiringDaysThreshold: req.expiringDaysThreshold,
    };
}

export function toGenerateDailySuggestionResponse(
    out: GenerateDailySuggestionOutput
): GenerateDailySuggestionResponse {
    return {
        householdId: out.householdId,
        date: out.date,
        slot: out.slot,
        status: "PROPUESTA",
        recipes: out.recipes.map((r) => ({ recipeId: r.recipeId, name: r.name })),
        reasoning: {
            usedExpiringIngredients: out.reasoning.usedExpiringIngredients,
            totalCandidateRecipes: out.reasoning.totalCandidateRecipes,
        },
    };
}
