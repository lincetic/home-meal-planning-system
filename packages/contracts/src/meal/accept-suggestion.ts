import { z } from "zod";
import { zId } from "../common/ids";
import { zRecipePortion } from "./recipe-portion";

export const zAcceptSuggestionRequest = z.object({
  suggestionId: z.string().uuid(),
  recipeId: z.string().uuid().optional(),
  portion: zRecipePortion.optional(),
});

export const zAcceptSuggestionResponse = z.object({
    suggestionId: zId,
    status: z.literal("ACEPTADA"),
    acceptedRecipeId: zId,
    acceptedPortion: zRecipePortion,
});

export type AcceptSuggestionRequest = z.infer<typeof zAcceptSuggestionRequest>;
export type AcceptSuggestionResponse = z.infer<typeof zAcceptSuggestionResponse>;
