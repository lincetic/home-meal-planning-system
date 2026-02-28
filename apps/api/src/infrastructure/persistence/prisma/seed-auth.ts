import { prisma } from "./prisma-client";
import argon2 from "argon2";

async function main() {
    // Keep stable for demo + frontend DEFAULT_HOUSEHOLD_ID
    const householdId = "550e8400-e29b-41d4-a716-446655440000";

    // Demo credentials (document these in README/http-examples)
    const email = "demo@tfm.local";
    const password = "Password123!";

    // 1) Ensure household exists
    await prisma.household.upsert({
        where: { id: householdId },
        create: { id: householdId },
        update: {},
    });

    // 2) Upsert user by email
    const passwordHash = await argon2.hash(password);

    const user = await prisma.user.upsert({
        where: { email },
        create: {
            email,
            passwordHash,
            name: "Demo User",
        },
        update: {
            // Keep demo deterministic: refresh password on each seed
            passwordHash,
            name: "Demo User",
        },
        select: { id: true, email: true },
    });

    // 3) Ensure membership exists (OWNER)
    await prisma.householdMember.upsert({
        where: { userId_householdId: { userId: user.id, householdId } },
        create: {
            userId: user.id,
            householdId,
            role: "OWNER",
        },
        update: {
            role: "OWNER",
        },
    });

    console.log("Seed auth done.");
    console.log(`- user: ${email}`);
    console.log(`- password: ${password}`);
    console.log(`- householdId: ${householdId}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
