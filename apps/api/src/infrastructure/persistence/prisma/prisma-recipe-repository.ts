import { RecipeRepository } from "../../../application/ports/recipe-repository";
import { Recipe } from "../../../domain/entities/recipe";
import { Quantity } from "../../../domain/value-objects/quantity";
import { prisma } from "./prisma-client";

export class PrismaRecipeRepository implements RecipeRepository {
    async listByHouseholdId(householdId: string): Promise<Recipe[]> {
        const recipes = await prisma.recipe.findMany({
            where: { householdId },
            include: { ingredients: true },
            orderBy: { name: "asc" },
        });

        return recipes.map(
            (r) =>
                new Recipe(
                    r.id,
                    r.name,
                    r.ingredients.map((i) => ({
                        ingredientId: i.ingredientId,
                        amount: Quantity.create(i.amount),
                    }))
                )
        );
    }

    async getByIds(householdId: string, recipeIds: string[]): Promise<Recipe[]> {
        const recipes = await prisma.recipe.findMany({
            where: {
                householdId,
                id: { in: recipeIds },
            },
            include: { ingredients: true },
            orderBy: { name: "asc" },
        });

        return recipes.map(
            (r) =>
                new Recipe(
                    r.id,
                    r.name,
                    r.ingredients.map((i) => ({
                        ingredientId: i.ingredientId,
                        amount: Quantity.create(i.amount),
                    }))
                )
        );
    }

}
