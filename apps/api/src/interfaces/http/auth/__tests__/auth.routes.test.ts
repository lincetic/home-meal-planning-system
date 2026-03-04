import { describe, it, expect, beforeEach } from "vitest";
import argon2 from "argon2";
import { prisma } from "../../../../infrastructure/persistence/prisma/prisma-client";

const DEFAULT_HOUSEHOLD_ID = "550e8400-e29b-41d4-a716-446655440000";

async function resetDb() {
    // Only auth-related tables; do NOT delete households (they are referenced by recipes)
    await prisma.householdMember.deleteMany({});
    await prisma.user.deleteMany({});
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


describe("Auth routes", () => {
    beforeEach(async () => {
        process.env.NODE_ENV = "test";
        process.env.JWT_SECRET = "test-secret";
        process.env.JWT_EXPIRES_IN = "7d";

        await resetDb();
        await seedUser();
    });

    it("POST /auth/login returns accessToken", async () => {
        const { buildApp } = await import("../../server");
        const app = buildApp();

        const res = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: {
                email: "demo@tfm.local",
                password: "Password123!",
            },
        });

        expect(res.statusCode).toBe(200);

        const body = res.json();
        expect(body.accessToken).toBeDefined();
        expect(body.user.email).toBe("demo@tfm.local");


    }, 15000);

    it("GET /auth/me without token returns 401", async () => {
        const { buildApp } = await import("../../server");
        const app = buildApp();

        const res = await app.inject({
            method: "GET",
            url: "/auth/me",
        });

        expect(res.statusCode).toBe(401);


    });
});
