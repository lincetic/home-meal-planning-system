import { describe, it, expect, beforeEach } from "vitest";
import argon2 from "argon2";
import { prisma } from "../../../../infrastructure/persistence/prisma/prisma-client";

const DEFAULT_HOUSEHOLD_ID = "550e8400-e29b-41d4-a716-446655440000";
const WRONG_HOUSEHOLD_ID = "11111111-1111-1111-1111-111111111111";

async function resetDb() {
    // Only auth-related tables; do NOT delete households (they are referenced by recipes)
    await prisma.householdMember.deleteMany({});
    await prisma.user.deleteMany({});
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
        where: { id: "test-recipe-1" },
        create: {
            id: "test-recipe-1",
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

    const passwordHash = await argon2.hash("Password123!");

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
    });

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
});