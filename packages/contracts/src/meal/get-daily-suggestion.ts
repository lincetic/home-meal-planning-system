import { z } from "zod";
import { zId } from "../common/ids";
import { zMealSlot } from "../common/enums";

const zDateYYYYMMDD = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const zGetDailySuggestionQuery = z.object({
    householdId: zId,
    date: zDateYYYYMMDD,
    slot: zMealSlot,
});

export type GetDailySuggestionQuery = z.infer<typeof zGetDailySuggestionQuery>;
