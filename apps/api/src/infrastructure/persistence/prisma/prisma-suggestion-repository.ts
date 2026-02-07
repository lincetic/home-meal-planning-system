import { prisma } from "./prisma-client";
import { PersistedSuggestion, SuggestionRepository, SuggestionStatus } from "../../../application/ports/suggestion-repository";

function toYYYYMMDD(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function toDate(dateYYYYMMDD: string): Date {
    // Interpret as UTC midnight (OK for MVP). Later: timezone strategy.
    return new Date(`${dateYYYYMMDD}T00:00:00.000Z`);
}

export class PrismaSuggestionRepository implements SuggestionRepository {
    async upsertDailySuggestion(data: Omit<PersistedSuggestion, "id">): Promise<PersistedSuggestion> {
        const date = toDate(data.date);

        const upserted = await prisma.mealSuggestion.upsert({
            where: {
                householdId_date_slot: { householdId: data.householdId, date, slot: data.slot },
            },
            create: {
                householdId: data.householdId,
                date,
                slot: data.slot,
                status: data.status as any,
                recipes: {
                    create: data.recipes.map((r) => ({
                        recipeId: r.recipeId,
                        recipeName: r.name,
                        position: r.position,
                    })),
                },
            },
            update: {
                status: data.status as any,
                recipes: {
                    deleteMany: {},
                    create: data.recipes.map((r) => ({
                        recipeId: r.recipeId,
                        recipeName: r.name,
                        position: r.position,
                    })),
                },
            },
            include: { recipes: true },
        });

        return {
            id: upserted.id,
            householdId: upserted.householdId,
            date: toYYYYMMDD(upserted.date),
            slot: upserted.slot as any,
            status: upserted.status as SuggestionStatus,
            recipes: upserted.recipes
                .sort((a, b) => a.position - b.position)
                .map((r) => ({ recipeId: r.recipeId, name: r.recipeName, position: r.position })),
        };
    }

    async getDailySuggestion(householdId: string, dateYYYYMMDD: string, slot: PersistedSuggestion["slot"]) {
        const date = toDate(dateYYYYMMDD);

        const found = await prisma.mealSuggestion.findUnique({
            where: { householdId_date_slot: { householdId, date, slot } },
            include: { recipes: true },
        });

        if (!found) return null;

        return {
            id: found.id,
            householdId: found.householdId,
            date: toYYYYMMDD(found.date),
            slot: found.slot as any,
            status: found.status as SuggestionStatus,
            recipes: found.recipes
                .sort((a, b) => a.position - b.position)
                .map((r) => ({ recipeId: r.recipeId, name: r.recipeName, position: r.position })),
        };
    }

    async setStatus(suggestionId: string, status: SuggestionStatus): Promise<void> {
        await prisma.mealSuggestion.update({
            where: { id: suggestionId },
            data: { status: status as any },
        });
    }

    async getById(suggestionId: string) {
        const found = await prisma.mealSuggestion.findUnique({
            where: { id: suggestionId },
            include: { recipes: true },
        });

        if (!found) return null;

        return {
            id: found.id,
            householdId: found.householdId,
            date: found.date.toISOString().slice(0, 10),
            slot: found.slot as any,
            status: found.status as any,
            recipes: found.recipes
                .sort((a, b) => a.position - b.position)
                .map((r) => ({ recipeId: r.recipeId, name: r.recipeName, position: r.position })),
        };
    }

}
