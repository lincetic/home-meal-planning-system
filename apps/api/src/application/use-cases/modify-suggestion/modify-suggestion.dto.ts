export interface ModifySuggestionInput {
    suggestionId: string;
    recipeIds: string[];
}

export interface ModifySuggestionOutput {
    suggestionId: string;
    status: "MODIFICADA";
}
