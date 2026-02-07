export type SuggestionStatus = "PROPUESTA" | "ACEPTADA" | "MODIFICADA";

export type PersistedSuggestion = {
    id: string;
    householdId: string;
    date: string; // YYYY-MM-DD
    slot: "DESAYUNO" | "COMIDA" | "CENA";
    status: SuggestionStatus;
    recipes: Array<{ recipeId: string; name: string; position: number }>;
};

export interface SuggestionRepository {
    upsertDailySuggestion(data: Omit<PersistedSuggestion, "id">): Promise<PersistedSuggestion>;
    getDailySuggestion(householdId: string, date: string, slot: PersistedSuggestion["slot"]): Promise<PersistedSuggestion | null>;
    setStatus(suggestionId: string, status: SuggestionStatus): Promise<void>;
    getById(suggestionId: string): Promise<PersistedSuggestion | null>;
}
