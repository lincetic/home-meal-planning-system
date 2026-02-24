import { prisma } from "./prisma-client";
import {
    PersistedSuggestion,
    SuggestionRepository,
    SuggestionStatus,
} from "../../../application/ports/suggestion-repository";

function toYYYYMMDD(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function toDate(dateYYYYMMDD: string): Date {
    // Interpret as UTC midnight (OK for MVP). Later: timezone strategy.
    return new Date(`${dateYYYYMMDD}T00:00:00.000Z`);
}

function normalizeAcceptedRecipeId(v: unknown): string | null {
    if (typeof v === "string" && v.trim().length > 0) return v;
    return null;
}

export class PrismaSuggestionRepository implements SuggestionRepository {
    async upsertDailySuggestion(
        data: Omit<PersistedSuggestion, "id">
    ): Promise<PersistedSuggestion> {
        const date = toDate(data.date);

        const normalized = normalizeAcceptedRecipeId((data as any).acceptedRecipeId);

        // 👇 Si viene null (o undefined), NO lo incluimos en update para no pisar el valor existente
        const acceptedRecipeUpdate =
            typeof (data as any).acceptedRecipeId === "string"
                ? { acceptedRecipeId: normalized }
                : {};

        const upserted = await prisma.mealSuggestion.upsert({
            where: {
                householdId_date_slot: {
                    householdId: data.householdId,
                    date,
                    slot: data.slot,
                },
            },
            create: {
                householdId: data.householdId,
                date,
                slot: data.slot,
                status: data.status as any,
                acceptedRecipeId: normalized, // en create vale null
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
                ...acceptedRecipeUpdate,
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
            acceptedRecipeId: normalizeAcceptedRecipeId(upserted.acceptedRecipeId),
            recipes: upserted.recipes
                .sort((a, b) => a.position - b.position)
                .map((r) => ({
                    recipeId: r.recipeId,
                    name: r.recipeName,
                    position: r.position,
                })),
        };
    }


    async getDailySuggestion(
        householdId: string,
        dateYYYYMMDD: string,
        slot: PersistedSuggestion["slot"]
    ): Promise<PersistedSuggestion | null> {
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
            acceptedRecipeId: normalizeAcceptedRecipeId(found.acceptedRecipeId),
            recipes: found.recipes
                .sort((a, b) => a.position - b.position)
                .map((r) => ({
                    recipeId: r.recipeId,
                    name: r.recipeName,
                    position: r.position,
                })),
        };
    }

    async setStatus(suggestionId: string, status: SuggestionStatus): Promise<void> {
        await prisma.mealSuggestion.update({
            where: { id: suggestionId },
            data: { status: status as any },
        });
    }

    async setAcceptedRecipe(
        suggestionId: string,
        recipeId: string
    ): Promise<void> {
        await prisma.mealSuggestion.update({
            where: { id: suggestionId },
            data: { acceptedRecipeId: recipeId },
        });
    }

    async getById(suggestionId: string): Promise<PersistedSuggestion | null> {
        const found = await prisma.mealSuggestion.findUnique({
            where: { id: suggestionId },
            include: { recipes: true },
        });

        if (!found) return null;

        return {
            id: found.id,
            householdId: found.householdId,
            date: toYYYYMMDD(found.date),
            slot: found.slot as any,
            status: found.status as SuggestionStatus,
            acceptedRecipeId: normalizeAcceptedRecipeId(found.acceptedRecipeId),
            recipes: found.recipes
                .sort((a, b) => a.position - b.position)
                .map((r) => ({
                    recipeId: r.recipeId,
                    name: r.recipeName,
                    position: r.position,
                })),
        };
    }
}