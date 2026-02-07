import { z } from "zod";
import { zId } from "../common/ids";

export const zAcceptSuggestionRequest = z.object({
    suggestionId: zId,
});

export const zAcceptSuggestionResponse = z.object({
    suggestionId: zId,
    status: z.literal("ACEPTADA"),
});

export type AcceptSuggestionRequest = z.infer<typeof zAcceptSuggestionRequest>;
export type AcceptSuggestionResponse = z.infer<typeof zAcceptSuggestionResponse>;
