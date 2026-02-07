import { z } from "zod";
import { zId } from "../common/ids";

export const zModifySuggestionRequest = z.object({
    suggestionId: zId,
    recipeIds: z.array(zId).min(1).max(3),
});

export const zModifySuggestionResponse = z.object({
    suggestionId: zId,
    status: z.literal("MODIFICADA"),
});

export type ModifySuggestionRequest = z.infer<typeof zModifySuggestionRequest>;
export type ModifySuggestionResponse = z.infer<typeof zModifySuggestionResponse>;
