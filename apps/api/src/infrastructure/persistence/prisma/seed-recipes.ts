import { prisma } from "./prisma-client";

async function main() {
    const householdId = "550e8400-e29b-41d4-a716-446655440000";

    await prisma.household.upsert({
        where: { id: householdId },
        create: { id: householdId },
        update: {},
    });

    // Limpieza simple
    await prisma.recipeIngredient.deleteMany({
        where: { recipe: { householdId } },
    });
    await prisma.recipe.deleteMany({ where: { householdId } });

    // IMPORTANTE: ingredientIds deben ser UUIDs coherentes con tu inventario/contratos
    const milk = "22222222-2222-2222-2222-222222222222";
    const rice = "33333333-3333-3333-3333-333333333333";

    await prisma.recipe.create({
        data: {
            id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            householdId,
            name: "Milk & Cereal",
            ingredients: {
                create: [{ ingredientId: milk, amount: 1 }],
            },
        },
    });

    await prisma.recipe.create({
        data: {
            id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            householdId,
            name: "Rice Bowl",
            ingredients: {
                create: [{ ingredientId: rice, amount: 1 }],
            },
        },
    });

    console.log("Seed recipes done.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
