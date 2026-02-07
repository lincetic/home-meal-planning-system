import {
    GenerateDailySuggestionPersistedRequest,
    GenerateDailySuggestionPersistedResponse,
} from "@tfm/contracts";

import { GenerateDailySuggestionInput } from "../../application/use-cases/generate-daily-suggestion/generate-daily-suggestion.dto";
import { PersistedSuggestion } from "../../application/ports/suggestion-repository";

export function toGenerateDailySuggestionInput(
    req: GenerateDailySuggestionPersistedRequest
): GenerateDailySuggestionInput {
    return {
        householdId: req.householdId,
        date: req.date,
        slot: req.slot,
        maxSuggestions: req.maxSuggestions,
        expiringDaysThreshold: req.expiringDaysThreshold,
    };
}

export function toPersistedSuggestionResponse(
    s: PersistedSuggestion
): GenerateDailySuggestionPersistedResponse {
    return {
        suggestionId: s.id,
        householdId: s.householdId,
        date: s.date,
        slot: s.slot,
        status: s.status,
        recipes: s.recipes.map((r) => ({
            recipeId: r.recipeId,
            name: r.name,
            position: r.position,
        })),
    };
}
