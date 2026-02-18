import { apiFetch } from "./client";

export const DEFAULT_HOUSEHOLD_ID = "550e8400-e29b-41d4-a716-446655440000";
export type MealSlot = "DESAYUNO" | "COMIDA" | "CENA";

export type Ingredient = { id: string; name: string; category?: string | null };

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

export function acceptSuggestion(body: unknown) {
    return apiFetch(`/suggestions/accept`, { method: "POST", body: JSON.stringify(body) });
}

export function shoppingListFromRecipes(body: unknown) {
    return apiFetch(`/shopping-list/from-recipes`, { method: "POST", body: JSON.stringify(body) });
}

export function getInventory(householdId: string) {
    const params = new URLSearchParams({ householdId }).toString();
    return apiFetch(`/inventory?${params}`);
}

export function getIngredientsByIds(ids: string[]) {
    const params = new URLSearchParams({ ids: ids.join(",") }).toString();
    return apiFetch<{ items: Ingredient[] }>(`/ingredients/by-ids?${params}`);
}

export function getPlanToday(body: any) {
    return apiFetch(`/plan/today`, { method: "POST", body: JSON.stringify(body) });
}
