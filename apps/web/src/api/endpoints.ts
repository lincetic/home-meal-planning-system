import { apiFetch } from "./client";

export const DEFAULT_HOUSEHOLD_ID = "550e8400-e29b-41d4-a716-446655440000";
export type MealSlot = "DESAYUNO" | "COMIDA" | "CENA";

export type Ingredient = { id: string; name: string; category?: string | null };

// Inventory DTOs (optional, but nice to type)
export type InventoryItemDto = {
    ingredientId: string;
    quantity: number;
    expirationDate: string | null;
};
export type InventoryDto = {
    householdId: string;
    items: InventoryItemDto[];
};

// Cooking plan DTOs (now includes acceptedRecipeId in SUGGESTION)
export type CookingPlanSuggestion = {
    kind: "SUGGESTION";
    suggestionId: string;
    status: "PROPUESTA" | "ACEPTADA" | "MODIFICADA";
    householdId: string;
    date: string;
    slot: MealSlot;
    acceptedRecipeId?: string | null;
    recipes: Array<{ recipeId: string; name: string; position: number }>;
};

export type CookingPlanNeedsShopping = {
    kind: "NEEDS_SHOPPING";
    householdId: string;
    date: string;
    slot: MealSlot;
    targetRecipe: { recipeId: string; name: string };
    shoppingList: { items: Array<{ ingredientId: string; missingAmount: number }> };
};

export type CookingPlan = CookingPlanSuggestion | CookingPlanNeedsShopping;

export function searchIngredients(q: string, limit = 10) {
    const params = new URLSearchParams({ q, limit: String(limit) }).toString();
    return apiFetch<{ items: Ingredient[] }>(`/ingredients/search?${params}`);
}

export function updateInventory(body: unknown) {
    return apiFetch(`/inventory/update`, { method: "POST", body: JSON.stringify(body) });
}

export function generateSuggestion(body: unknown) {
    return apiFetch(`/suggestions/generate`, { method: "POST", body: JSON.stringify(body) });
}

export function modifySuggestion(body: unknown) {
    return apiFetch(`/suggestions/modify`, { method: "POST", body: JSON.stringify(body) });
}

export function acceptSuggestion(body: { suggestionId: string; recipeId?: string }) {
    return apiFetch<{ suggestionId: string; status: "ACEPTADA" }>(`/suggestions/accept`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export function shoppingListFromRecipes(body: unknown) {
    return apiFetch(`/shopping-list/from-recipes`, { method: "POST", body: JSON.stringify(body) });
}

export function getInventory(householdId: string) {
    const params = new URLSearchParams({ householdId }).toString();
    return apiFetch<InventoryDto>(`/inventory?${params}`);
}

export function getIngredientsByIds(ids: string[]) {
    const params = new URLSearchParams({ ids: ids.join(",") }).toString();
    return apiFetch<{ items: Ingredient[] }>(`/ingredients/by-ids?${params}`);
}

export function getPlanToday(body: {
    householdId: string;
    date: string;
    slot: MealSlot;
    maxSuggestions?: number;
}) {
    return apiFetch<CookingPlan>(`/plan/today`, { method: "POST", body: JSON.stringify(body) });
}

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
  return apiFetch<{ user: AuthUser; households: Array<{ id: string; role: "OWNER" | "MEMBER" }> }>(`/auth/me`);
}
