import { z } from "zod";
import { zId } from "../common/ids";
import { zMealSlot, zSuggestionStatus } from "../common/enums";
import { zRecipePortion } from "./recipe-portion";

const zDateYYYYMMDD = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const zGetCookingPlanRequest = z.object({
    householdId: zId,
    date: zDateYYYYMMDD,
    slot: zMealSlot,
    maxSuggestions: z.number().int().min(1).max(3).optional(),
});

const zSuggestedRecipe = z.object({
    recipeId: zId,
    name: z.string().min(1),
    position: z.number().int().min(0),
});

const zShoppingItem = z.object({
    ingredientId: zId,
    missingAmount: z.number().positive(),
});

// ✅ Opción A: respuesta explícita cuando ya existe una sugerencia aceptada
export const zCookingPlanAccepted = z.object({
    kind: z.literal("ACCEPTED"),
    suggestionId: zId,
    status: z.literal("ACEPTADA"),
    householdId: zId,
    date: zDateYYYYMMDD,
    slot: zMealSlot,

    acceptedRecipe: z.object({
        recipeId: zId,
        name: z.string().min(1),
    }),
    acceptedPortion: zRecipePortion,

    alternatives: z.array(zSuggestedRecipe).max(50),
});

export const zCookingPlanSuggestion = z.object({
    kind: z.literal("SUGGESTION"),
    suggestionId: zId,
    status: zSuggestionStatus,
    householdId: zId,
    date: zDateYYYYMMDD,
    slot: zMealSlot,

    // Si el backend lo envía, el front debe soportarlo.
    // Ojo: aquí NO “forzamos” que exista cuando status === ACEPTADA,
    // eso lo garantiza la lógica de backend + tests.
    acceptedRecipeId: zId.nullable().optional(),
    acceptedPortion: zRecipePortion.nullable().optional(),

    recipes: z.array(zSuggestedRecipe).min(1).max(3),
});

export const zCookingPlanNeedsShopping = z.object({
    kind: z.literal("NEEDS_SHOPPING"),
    householdId: zId,
    date: zDateYYYYMMDD,
    slot: zMealSlot,
    targetRecipe: z.object({
        recipeId: zId,
        name: z.string().min(1),
    }),
    shoppingList: z.object({
        items: z.array(zShoppingItem).min(1),
    }),
});

export const zGetCookingPlanResponse = z.union([
    zCookingPlanSuggestion,
    zCookingPlanNeedsShopping,
    zCookingPlanAccepted, // ✅ CRÍTICO: antes faltaba
]);

export type GetCookingPlanRequest = z.infer<typeof zGetCookingPlanRequest>;
export type GetCookingPlanResponse = z.infer<typeof zGetCookingPlanResponse>;
