import { prisma } from "./prisma-client";

function normalizeName(name: string) {
    return name
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quitar acentos
        .replace(/\s+/g, " ");
}

async function getOrCreateIngredientId(name: string, category?: string | null) {
    const normalizedName = normalizeName(name);

    const existing = await prisma.ingredient.findUnique({
        where: { normalizedName },
        select: { id: true },
    });

    if (existing) return existing.id;

    const created = await prisma.ingredient.create({
        data: {
            name: name.trim(),
            normalizedName,
            category: category ?? null,
        },
        select: { id: true },
    });

    return created.id;
}

async function main() {
    const householdId = "550e8400-e29b-41d4-a716-446655440000";

    await prisma.household.upsert({
        where: { id: householdId },
        create: { id: householdId },
        update: {},
    });

    // Limpieza: recetas del household
    await prisma.recipeIngredient.deleteMany({
        where: { recipe: { householdId } },
    });
    await prisma.recipe.deleteMany({ where: { householdId } });

    // Ingredient IDs (reales) desde catálogo
    const milkId = await getOrCreateIngredientId("Leche", "Lácteos");
    const riceId = await getOrCreateIngredientId("Arroz", "Cereales");

    // Receta 1
    await prisma.recipe.create({
        data: {
            id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            householdId,
            name: "Milk & Cereal",
            ingredients: {
                create: [{ ingredientId: milkId, amount: 1 }],
            },
        },
    });

    // Receta 2
    await prisma.recipe.create({
        data: {
            id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            householdId,
            name: "Rice Bowl",
            ingredients: {
                create: [{ ingredientId: riceId, amount: 1 }],
            },
        },
    });

    console.log("Seed recipes done.");
    console.log("Ingredient IDs used:", { milkId, riceId });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
