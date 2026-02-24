export type AcceptSuggestionInput = {
  suggestionId: string;
  recipeId?: string;
};

export type AcceptSuggestionOutput = {
  suggestionId: string;
  status: "ACEPTADA";
};

