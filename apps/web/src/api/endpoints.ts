import { apiFetch } from "./client";

export const DEFAULT_HOUSEHOLD_ID = "550e8400-e29b-41d4-a716-446655440000";
export type MealSlot = "DESAYUNO" | "COMIDA" | "CENA";

export type Ingredient = { id: string; name: string; category?: string | null };

// Inventory DTOs
export type InventoryItemDto = {
    ingredientId: string;
    quantity: number;
    expirationDate: string | null;
};
export type InventoryDto = {
    householdId: string;
    items: InventoryItemDto[];
};

// Cooking plan DTOs
export type CookingPlanSuggestedRecipe = {
    recipeId: string;
    name: string;
    position: number;
};

export type CookingPlanSuggestion = {
    kind: "SUGGESTION";
    suggestionId: string;
    status: "PROPUESTA" | "ACEPTADA" | "MODIFICADA";
    householdId: string;
    date: string;
    slot: MealSlot;

    acceptedRecipeId?: string | null;

    recipes: CookingPlanSuggestedRecipe[];
};

export type CookingPlanAccepted = {
    kind: "ACCEPTED";
    suggestionId: string;
    status: "ACEPTADA";
    householdId: string;
    date: string;
    slot: MealSlot;

    acceptedRecipe: { recipeId: string; name: string };
    alternatives: CookingPlanSuggestedRecipe[];
};

export type CookingPlanNeedsShopping = {
    kind: "NEEDS_SHOPPING";
    householdId: string;
    date: string;
    slot: MealSlot;
    targetRecipe: { recipeId: string; name: string };
    shoppingList: { items: Array<{ ingredientId: string; missingAmount: number }> };
};

export type CookingPlan = CookingPlanSuggestion | CookingPlanNeedsShopping | CookingPlanAccepted;

// ---- Ingredients
export function searchIngredients(q: string, limit = 10) {
    const params = new URLSearchParams({ q, limit: String(limit) }).toString();
    return apiFetch<{ items: Ingredient[] }>(`/ingredients/search?${params}`);
}

export function getIngredientsByIds(ids: string[]) {
    const params = new URLSearchParams({ ids: ids.join(",") }).toString();
    return apiFetch<{ items: Ingredient[] }>(`/ingredients/by-ids?${params}`);
}

// ---- Inventory
export function updateInventory(body: unknown) {
    return apiFetch(`/inventory/update`, { method: "POST", body: JSON.stringify(body) });
}

export function getInventory(householdId: string) {
    const params = new URLSearchParams({ householdId }).toString();
    return apiFetch<InventoryDto>(`/inventory?${params}`);
}

// ---- Suggestions / Plan
export function acceptSuggestion(body: { suggestionId: string; recipeId?: string }) {
    return apiFetch<{ suggestionId: string; status: "ACEPTADA" }>(`/suggestions/accept`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export function getPlanToday(body: {
    householdId: string;
    date: string;
    slot: MealSlot;
    maxSuggestions?: number;
}) {
    return apiFetch<CookingPlan>(`/plan/today`, { method: "POST", body: JSON.stringify(body) });
}

// ---- Auth
export type AuthUser = { id: string; email: string; name?: string | null };

export function register(body: { email: string; password: string; name?: string }) {
    return apiFetch<{ user: AuthUser; accessToken: string }>(`/auth/register`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export function login(body: { email: string; password: string }) {
    return apiFetch<{ user: AuthUser; accessToken: string }>(`/auth/login`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export function me() {
    return apiFetch<{ user: AuthUser; households: Array<{ id: string; role: "OWNER" | "MEMBER" }> }>(`/auth/me`, {
        method: "GET",
    });
}