import type {
    AcceptSuggestionRequest,
    AcceptSuggestionResponse,
} from "@tfm/contracts";
import type {
    AcceptSuggestionInput,
    AcceptSuggestionOutput,
} from "../../application/use-cases/accept-suggestion/accept-suggestion.dto";

export function toAcceptSuggestionInput(
    request: AcceptSuggestionRequest
): AcceptSuggestionInput {
    return {
        suggestionId: request.suggestionId,
        recipeId: request.recipeId,
        portion: request.portion,
    };
}

export function toAcceptSuggestionResponse(
    output: AcceptSuggestionOutput
): AcceptSuggestionResponse {
    return {
        suggestionId: output.suggestionId,
        status: output.status,
        acceptedRecipeId: output.acceptedRecipeId,
        acceptedPortion: output.acceptedPortion,
    };
}
