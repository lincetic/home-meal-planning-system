import { z } from "zod";

/**
 * Estado de una sugerencia de comida
 */
export const zSuggestionStatus = z.enum([
    "PROPUESTA",
    "ACEPTADA",
    "MODIFICADA",
]);

export type SuggestionStatus = z.infer<typeof zSuggestionStatus>;

/**
 * Momento del día para una comida
 */
export const zMealSlot = z.enum([
    "DESAYUNO",
    "COMIDA",
    "CENA",
]);

export type MealSlot = z.infer<typeof zMealSlot>;
