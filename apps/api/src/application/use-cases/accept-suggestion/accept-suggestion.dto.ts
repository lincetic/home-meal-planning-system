import type { RecipePortionValue } from "../../../domain/value-objects/recipe-portion";

export type AcceptSuggestionInput = {
  suggestionId: string;
  recipeId?: string;
  portion?: RecipePortionValue;
};

export type AcceptSuggestionOutput = {
  suggestionId: string;
  status: "ACEPTADA";
  acceptedRecipeId: string;
  acceptedPortion: RecipePortionValue;
};

