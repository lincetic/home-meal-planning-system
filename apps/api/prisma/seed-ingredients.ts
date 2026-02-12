import { prisma } from "../src/infrastructure/persistence/prisma/prisma-client";
import fs from "node:fs";
import path from "node:path";

function normalizeName(name: string) {
    return name
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/\s+/g, " ");
}

async function main() {
    const filePath = path.join(__dirname, "seed-data", "ingredients_es.csv");
    const raw = fs.readFileSync(filePath, "utf-8").trim();

    const [headerLine, ...lines] = raw.split(/\r?\n/);
    const headers = headerLine.split(",").map((h) => h.trim());

    const nameIdx = headers.indexOf("name");
    const catIdx = headers.indexOf("category");

    if (nameIdx === -1) throw new Error("CSV must include 'name' column");

    const rows = lines
        .map((l) => l.split(","))
        .map((cols) => ({
            name: (cols[nameIdx] ?? "").trim(),
            category: catIdx >= 0 ? (cols[catIdx] ?? "").trim() || null : null,
        }))
        .filter((r) => r.name.length > 0);

    const data = rows.map((r) => ({
        name: r.name,
        normalizedName: normalizeName(r.name),
        category: r.category,
    }));

    // Upsert-like behavior using createMany + skipDuplicates on unique normalizedName
    const result = await prisma.ingredient.createMany({
        data,
        skipDuplicates: true,
    });

    console.log(`Seed ingredients: inserted ${result.count} rows (duplicates skipped).`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
