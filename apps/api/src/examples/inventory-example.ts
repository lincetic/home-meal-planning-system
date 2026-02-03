import { Inventory } from "../domain/entities/inventory";
import { Quantity } from "../domain/value-objects/quantity";

function printInventory(inv: Inventory, title: string) {
    console.log("\n=== " + title + " ===");

    const items = inv.getItems();
    if (items.length === 0) {
        console.log("(vacío)");
        return;
    }

    for (const item of items) {
        const exp = item.getExpirationDate();
        console.log({
            ingredientId: item.getIngredientId(),
            quantity: item.getQuantity().getValue(),
            expirationDate: exp ? exp.toISOString().slice(0, 10) : null,
            expiringSoon: item.isExpiringSoon(new Date("2026-02-03"), 3),
        });
    }
}

export function runInventoryExample() {
    // Fecha de referencia (simula "hoy")
    const today = new Date("2026-02-03");

    // Creamos inventario vacío
    const inv = new Inventory();

    printInventory(inv, "Inventario inicial");

    // Añadimos ingredientes
    inv.addIngredient("milk", Quantity.create(2), new Date("2026-02-05")); // caduca en 2 días
    inv.addIngredient("rice", Quantity.create(1)); // sin caducidad
    inv.addIngredient("eggs", Quantity.create(12), new Date("2026-02-10")); // caduca en 7 días

    printInventory(inv, "Tras añadir leche, arroz y huevos");

    // Añadimos más leche (mismo ingredientId) => se mergea
    inv.addIngredient("milk", Quantity.create(1));

    printInventory(inv, "Tras añadir +1 leche (merge de cantidades)");

    // Consumimos algo de leche
    inv.consumeIngredient("milk", Quantity.create(2));

    printInventory(inv, "Tras consumir 2 de leche");

    // Consumimos el resto de leche => debería eliminarse el item (queda 0)
    inv.consumeIngredient("milk", Quantity.create(1));

    printInventory(inv, "Tras consumir el resto de leche (se elimina)");

    // Consultamos qué está a punto de caducar (<= 3 días)
    const expSoon = inv.getExpiringSoon(today, 3);
    console.log("\n=== Próximos a caducar (<= 3 días) ===");
    console.log(expSoon.map((i) => i.getIngredientId()));

    // Caso de error: consumir algo inexistente
    try {
        inv.consumeIngredient("tomato", Quantity.create(1));
    } catch (e) {
        console.log("\n=== Error esperado al consumir ingrediente inexistente ===");
        console.log(String(e));
    }

    // Caso de error: Quantity negativa
    try {
        Quantity.create(-1);
    } catch (e) {
        console.log("\n=== Error esperado al crear Quantity negativa ===");
        console.log(String(e));
    }
}

// Permite ejecutar el archivo directamente con node/ts-node en el futuro
if (require.main === module) {
    runInventoryExample();
}
