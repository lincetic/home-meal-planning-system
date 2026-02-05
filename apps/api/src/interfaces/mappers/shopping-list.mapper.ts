import {
    GenerateShoppingListRequest,
    GenerateShoppingListResponse,
} from "@tfm/contracts";

import {
    GenerateShoppingListInput,
    GenerateShoppingListOutput,
} from "../../application/use-cases/generate-shopping-list/generate-shopping-list.dto";

export function toGenerateShoppingListInput(
    req: GenerateShoppingListRequest
): GenerateShoppingListInput {
    return req;
}

export function toGenerateShoppingListResponse(
    out: GenerateShoppingListOutput
): GenerateShoppingListResponse {
    return out;
}
