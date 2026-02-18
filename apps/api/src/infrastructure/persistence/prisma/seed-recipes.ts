import { prisma } from "./prisma-client";

function normalizeName(name: string) {
    return name
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
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

type SeedRecipe = {
    id: string;
    name: string;
    ingredients: Array<{ name: string; category?: string; amount: number }>;
};

async function main() {
    const householdId = "550e8400-e29b-41d4-a716-446655440000";

    await prisma.household.upsert({
        where: { id: householdId },
        create: { id: householdId },
        update: {},
    });

    // Clean existing recipes for the household
    await prisma.recipeIngredient.deleteMany({
        where: { recipe: { householdId } },
    });
    await prisma.recipe.deleteMany({ where: { householdId } });

    // ====== Recipes designed for a clear demo ======
    // IDs: keep stable for docs/testing
    const recipes: SeedRecipe[] = [
        {
            id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            name: "Milk & Cereal",
            ingredients: [{ name: "Leche", category: "Lácteos", amount: 1 }],
        },
        {
            id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            name: "Rice Bowl",
            ingredients: [{ name: "Arroz", category: "Cereales", amount: 1 }],
        },
        {
            id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
            name: "Pasta with Tomato",
            ingredients: [
                { name: "Pasta", category: "Cereales", amount: 1 },
                { name: "Tomate", category: "Verduras", amount: 2 },
                { name: "Aceite de oliva", category: "Aceites", amount: 1 },
                { name: "Sal", category: "Condimentos", amount: 1 },
            ],
        },
        {
            id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
            name: "Simple Salad",
            ingredients: [
                { name: "Tomate", category: "Verduras", amount: 2 },
                { name: "Cebolla", category: "Verduras", amount: 1 },
                { name: "Aceite de oliva", category: "Aceites", amount: 1 },
                { name: "Sal", category: "Condimentos", amount: 1 },
            ],
        },
        {
            id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
            name: "Scrambled Eggs",
            ingredients: [
                { name: "Huevos", category: "Huevos", amount: 2 },
                { name: "Aceite de oliva", category: "Aceites", amount: 1 },
                { name: "Sal", category: "Condimentos", amount: 1 },
            ],
        },
        {
            id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
            name: "Omelette with Onion",
            ingredients: [
                { name: "Huevos", category: "Huevos", amount: 2 },
                { name: "Cebolla", category: "Verduras", amount: 1 },
                { name: "Aceite de oliva", category: "Aceites", amount: 1 },
                { name: "Sal", category: "Condimentos", amount: 1 },
            ],
        },
        {
            id: "11111111-1111-1111-1111-111111111111",
            name: "Chicken and Rice",
            ingredients: [
                { name: "Pollo", category: "Carnes", amount: 1 },
                { name: "Arroz", category: "Cereales", amount: 1 },
                { name: "Aceite de oliva", category: "Aceites", amount: 1 },
                { name: "Sal", category: "Condimentos", amount: 1 },
            ],
        },
        {
            id: "22222222-2222-2222-2222-222222222222",
            name: "Tuna Sandwich",
            ingredients: [
                { name: "Pan", category: "Panadería", amount: 2 },
                { name: "Atún", category: "Pescado", amount: 1 },
            ],
        },
        {
            id: "33333333-3333-3333-3333-333333333333",
            name: "Yogurt with Banana",
            ingredients: [
                { name: "Yogur", category: "Lácteos", amount: 1 },
                { name: "Plátano", category: "Frutas", amount: 1 },
            ],
        },
        {
            id: "44444444-4444-4444-4444-444444444444",
            name: "Cheese Toast",
            ingredients: [
                { name: "Pan", category: "Panadería", amount: 2 },
                { name: "Queso", category: "Lácteos", amount: 1 },
            ],
        },
    ];

    // Ensure all ingredients exist and create recipes
    for (const r of recipes) {
        const ingredientCreates = [];
        for (const ing of r.ingredients) {
            const ingredientId = await getOrCreateIngredientId(ing.name, ing.category ?? null);
            ingredientCreates.push({ ingredientId, amount: ing.amount });
        }

        await prisma.recipe.create({
            data: {
                id: r.id,
                householdId,
                name: r.name,
                ingredients: {
                    create: ingredientCreates,
                },
            },
        });
    }

    console.log(`Seed recipes done. Inserted ${recipes.length} recipes for household ${householdId}.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
