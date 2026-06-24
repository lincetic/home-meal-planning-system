import { describe, it, expect, beforeEach } from "vitest";
import argon2 from "argon2";
import { prisma } from "../../../../infrastructure/persistence/prisma/prisma-client";

const DEFAULT_HOUSEHOLD_ID = "550e8400-e29b-41d4-a716-446655440000";
const WRONG_HOUSEHOLD_ID = "11111111-1111-1111-1111-111111111111";
const DEFAULT_RECIPE_ID = "22222222-2222-4222-8222-222222222222";
const WRONG_RECIPE_ID = "33333333-3333-4333-8333-333333333333";
const PLAN_TEST_RECIPE_ID = "55555555-5555-4555-8555-555555555555";

async function resetDb() {
    const testHouseholdIds = [DEFAULT_HOUSEHOLD_ID, WRONG_HOUSEHOLD_ID];
    await prisma.mealSuggestionRecipe.deleteMany({
        where: {
            suggestion: {
                householdId: { in: testHouseholdIds },
            },
        },
    });
    await prisma.mealSuggestion.deleteMany({
        where: { householdId: { in: testHouseholdIds } },
    });
    await prisma.inventoryItem.deleteMany({
        where: { householdId: { in: testHouseholdIds } },
    });
    // Only auth-related tables; do NOT delete households (they are referenced by recipes)
    await prisma.householdMember.deleteMany({});
    await prisma.user.deleteMany({});
}

async function seedAcceptableSuggestion(
    householdId: string,
    recipeId: string
) {
    await prisma.household.upsert({
        where: { id: householdId },
        create: { id: householdId },
        update: {},
    });

    const ingredient = await prisma.ingredient.upsert({
        where: { normalizedName: `rice-${householdId}` },
        create: {
            name: "Rice",
            normalizedName: `rice-${householdId}`,
            category: "Cereals",
        },
        update: {},
        select: { id: true },
    });

    await prisma.recipe.upsert({
        where: { id: recipeId },
        create: {
            id: recipeId,
            householdId,
            name: "Rice Bowl",
            ingredients: {
                create: [{ ingredientId: ingredient.id, amount: 2 }],
            },
        },
        update: {
            householdId,
            name: "Rice Bowl",
            ingredients: {
                deleteMany: {},
                create: [{ ingredientId: ingredient.id, amount: 2 }],
            },
        },
    });

    await prisma.inventoryItem.upsert({
        where: {
            householdId_ingredientId: {
                householdId,
                ingredientId: ingredient.id,
            },
        },
        create: {
            householdId,
            ingredientId: ingredient.id,
            quantity: 1,
        },
        update: { quantity: 1 },
    });

    const suggestion = await prisma.mealSuggestion.create({
        data: {
            householdId,
            date: new Date("2026-06-24T00:00:00.000Z"),
            slot: "COMIDA",
            status: "PROPUESTA",
            recipes: {
                create: [{
                    recipeId,
                    recipeName: "Rice Bowl",
                    position: 0,
                }],
            },
        },
        select: { id: true },
    });

    return { suggestionId: suggestion.id, ingredientId: ingredient.id };
}

// Minimal seed so /plan/today can run business logic without "No recipes available"
async function seedMinimalRecipeForHousehold(householdId: string) {
    await prisma.household.upsert({
        where: { id: householdId },
        create: { id: householdId },
        update: {},
    });

    const ing = await prisma.ingredient.upsert({
        where: { normalizedName: "leche" },
        create: {
            name: "Leche",
            normalizedName: "leche",
            category: "Lácteos",
        },
        update: {},
        select: { id: true },
    });

    // Ensure a stable recipe exists for this household
    await prisma.recipe.upsert({
        where: { id: PLAN_TEST_RECIPE_ID },
        create: {
            id: PLAN_TEST_RECIPE_ID,
            householdId,
            name: "Milk & Cereal (test)",
            ingredients: {
                create: [{ ingredientId: ing.id, amount: 1 }],
            },
        },
        update: {
            householdId,
            name: "Milk & Cereal (test)",
        },
    });
}

async function seedUser() {
    await prisma.household.upsert({
        where: { id: DEFAULT_HOUSEHOLD_ID },
        create: { id: DEFAULT_HOUSEHOLD_ID },
        update: {},
    });

    const passwordHash = await argon2.hash("Password123!", {
        type: argon2.argon2id,
        timeCost: 1,
        memoryCost: 2 ** 12,
        parallelism: 1,
    });

    const user = await prisma.user.upsert({
        where: { email: "demo@tfm.local" },
        create: {
            email: "demo@tfm.local",
            passwordHash,
            name: "Demo User",
        },
        update: {
            passwordHash,
            name: "Demo User",
        },
        select: { id: true, email: true },
    });

    await prisma.householdMember.upsert({
        where: { userId_householdId: { userId: user.id, householdId: DEFAULT_HOUSEHOLD_ID } },
        create: { userId: user.id, householdId: DEFAULT_HOUSEHOLD_ID, role: "OWNER" },
        update: { role: "OWNER" },
    });

    return user;
}

describe("Authorization checks", () => {
    beforeEach(async () => {
        process.env.NODE_ENV = "test";
        process.env.JWT_SECRET = "test-secret";

        await resetDb();
        await seedUser();

        // ✅ Critical: avoid "No recipes available" so we can actually reach household authorization
        await seedMinimalRecipeForHousehold(DEFAULT_HOUSEHOLD_ID);
    });

    it("POST /plan/today without token returns 401", async () => {
        const { buildApp } = await import("../../server");
        const app = buildApp();

        const res = await app.inject({
            method: "POST",
            url: "/plan/today",
            payload: {
                householdId: DEFAULT_HOUSEHOLD_ID,
                date: "2026-02-03",
                slot: "CENA",
            },
        });

        expect(res.statusCode).toBe(401);
    }, 15000);

    it("POST /plan/today with wrong household returns 403", async () => {
        const { buildApp } = await import("../../server");
        const app = buildApp();

        const loginRes = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: {
                email: "demo@tfm.local",
                password: "Password123!",
            },
        });

        const token = loginRes.json().accessToken;

        const res = await app.inject({
            method: "POST",
            url: "/plan/today",
            headers: {
                authorization: `Bearer ${token}`,
            },
            payload: {
                householdId: WRONG_HOUSEHOLD_ID,
                date: "2026-02-03",
                slot: "CENA",
            },
        });

        expect(res.statusCode).toBe(403);
    });

    it("POST /plan/today returns recipes matching the HTTP contract", async () => {
        const ingredient = await prisma.ingredient.findUniqueOrThrow({
            where: { normalizedName: "leche" },
            select: { id: true },
        });
        await prisma.inventoryItem.upsert({
            where: {
                householdId_ingredientId: {
                    householdId: DEFAULT_HOUSEHOLD_ID,
                    ingredientId: ingredient.id,
                },
            },
            create: {
                householdId: DEFAULT_HOUSEHOLD_ID,
                ingredientId: ingredient.id,
                quantity: 2,
            },
            update: { quantity: 2 },
        });

        const { buildApp } = await import("../../server");
        const app = buildApp();
        const loginRes = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: {
                email: "demo@tfm.local",
                password: "Password123!",
            },
        });

        const res = await app.inject({
            method: "POST",
            url: "/plan/today",
            headers: {
                authorization: `Bearer ${loginRes.json().accessToken}`,
            },
            payload: {
                householdId: DEFAULT_HOUSEHOLD_ID,
                date: "2026-07-01",
                slot: "CENA",
            },
        });

        expect(res.statusCode).toBe(200);
    });

    it("POST /suggestions/accept without token returns 401", async () => {
        const seeded = await seedAcceptableSuggestion(
            DEFAULT_HOUSEHOLD_ID,
            DEFAULT_RECIPE_ID
        );
        const { buildApp } = await import("../../server");
        const app = buildApp();

        const res = await app.inject({
            method: "POST",
            url: "/suggestions/accept",
            payload: {
                suggestionId: seeded.suggestionId,
                recipeId: DEFAULT_RECIPE_ID,
                portion: "HALF",
            },
        });

        expect(res.statusCode).toBe(401);
    });

    it("POST /suggestions/accept returns 403 for another household", async () => {
        const seeded = await seedAcceptableSuggestion(
            WRONG_HOUSEHOLD_ID,
            WRONG_RECIPE_ID
        );
        const { buildApp } = await import("../../server");
        const app = buildApp();
        const loginRes = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: {
                email: "demo@tfm.local",
                password: "Password123!",
            },
        });

        const res = await app.inject({
            method: "POST",
            url: "/suggestions/accept",
            headers: {
                authorization: `Bearer ${loginRes.json().accessToken}`,
            },
            payload: {
                suggestionId: seeded.suggestionId,
                recipeId: WRONG_RECIPE_ID,
                portion: "HALF",
            },
        });

        expect(res.statusCode).toBe(403);
        const inventory = await prisma.inventoryItem.findUnique({
            where: {
                householdId_ingredientId: {
                    householdId: WRONG_HOUSEHOLD_ID,
                    ingredientId: seeded.ingredientId,
                },
            },
        });
        expect(inventory?.quantity).toBe(1);
    });

    it("POST /suggestions/accept accepts a half recipe for a household member", async () => {
        const seeded = await seedAcceptableSuggestion(
            DEFAULT_HOUSEHOLD_ID,
            DEFAULT_RECIPE_ID
        );
        await prisma.inventoryItem.update({
            where: {
                householdId_ingredientId: {
                    householdId: DEFAULT_HOUSEHOLD_ID,
                    ingredientId: seeded.ingredientId,
                },
            },
            data: { quantity: 2 },
        });
        const { buildApp } = await import("../../server");
        const app = buildApp();
        const loginRes = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: {
                email: "demo@tfm.local",
                password: "Password123!",
            },
        });

        const res = await app.inject({
            method: "POST",
            url: "/suggestions/accept",
            headers: {
                authorization: `Bearer ${loginRes.json().accessToken}`,
            },
            payload: {
                suggestionId: seeded.suggestionId,
                recipeId: DEFAULT_RECIPE_ID,
                portion: "HALF",
            },
        });

        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({
            suggestionId: seeded.suggestionId,
            status: "ACEPTADA",
            acceptedRecipeId: DEFAULT_RECIPE_ID,
            acceptedPortion: "HALF",
        });
        const inventory = await prisma.inventoryItem.findUnique({
            where: {
                householdId_ingredientId: {
                    householdId: DEFAULT_HOUSEHOLD_ID,
                    ingredientId: seeded.ingredientId,
                },
            },
        });
        expect(inventory?.quantity).toBe(1);

        const planRes = await app.inject({
            method: "POST",
            url: "/plan/today",
            headers: {
                authorization: `Bearer ${loginRes.json().accessToken}`,
            },
            payload: {
                householdId: DEFAULT_HOUSEHOLD_ID,
                date: "2026-06-24",
                slot: "COMIDA",
            },
        });

        expect(planRes.statusCode).toBe(200);
        expect(planRes.json()).toMatchObject({
            status: "ACEPTADA",
            acceptedRecipeId: DEFAULT_RECIPE_ID,
            acceptedPortion: "HALF",
        });
    });
});
