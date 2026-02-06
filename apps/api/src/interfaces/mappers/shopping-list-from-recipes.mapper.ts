import {
    GenerateShoppingListFromRecipesRequest,
    GenerateShoppingListFromRecipesResponse,
} from "@tfm/contracts";

import {
    GenerateShoppingListFromRecipesInput,
    GenerateShoppingListFromRecipesOutput,
} from "../../application/use-cases/generate-shopping-list-from-recipes/generate-shopping-list-from-recipes.dto";

export function toGenerateShoppingListFromRecipesInput(
    req: GenerateShoppingListFromRecipesRequest
): GenerateShoppingListFromRecipesInput {
    return req;
}

export function toGenerateShoppingListFromRecipesResponse(
    out: GenerateShoppingListFromRecipesOutput
): GenerateShoppingListFromRecipesResponse {
    return out;
}
