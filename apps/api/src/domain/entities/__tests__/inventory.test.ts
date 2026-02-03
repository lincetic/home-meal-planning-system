import { describe, it, expect } from "vitest";
import { Inventory } from "../inventory";
import { Quantity } from "../../value-objects/quantity";

describe("Inventory (Aggregate Root)", () => {
    it("añade un ingrediente nuevo al inventario", () => {
        const inv = new Inventory();

        inv.addIngredient("milk", Quantity.create(2));

        const item = inv.getItem("milk");
        expect(item).toBeDefined();
        expect(item!.getQuantity().getValue()).toBe(2);
    });

    it("mergea cantidades si se añade el mismo ingrediente", () => {
        const inv = new Inventory();

        inv.addIngredient("milk", Quantity.create(2));
        inv.addIngredient("milk", Quantity.create(1));

        const item = inv.getItem("milk");
        expect(item!.getQuantity().getValue()).toBe(3);

        // Regla: no hay duplicados
        expect(inv.getItems().length).toBe(1);
    });

    it("consume cantidad y elimina el item si queda en 0", () => {
        const inv = new Inventory();

        inv.addIngredient("rice", Quantity.create(3));

        inv.consumeIngredient("rice", Quantity.create(2));
        expect(inv.getItem("rice")!.getQuantity().getValue()).toBe(1);

        inv.consumeIngredient("rice", Quantity.create(1));
        expect(inv.getItem("rice")).toBeUndefined();
        expect(inv.getItems().length).toBe(0);
    });

    it("lanza error al consumir un ingrediente inexistente", () => {
        const inv = new Inventory();

        expect(() => inv.consumeIngredient("tomato", Quantity.create(1))).toThrow();
    });

    it("devuelve items próximos a caducar según umbral", () => {
        const inv = new Inventory();
        const today = new Date("2026-02-03");

        // caduca en 2 días => dentro de umbral 3
        inv.addIngredient("milk", Quantity.create(1), new Date("2026-02-05"));

        // caduca en 7 días => fuera de umbral 3
        inv.addIngredient("eggs", Quantity.create(12), new Date("2026-02-10"));

        // sin caducidad => nunca expiring soon
        inv.addIngredient("rice", Quantity.create(1));

        const expSoon = inv.getExpiringSoon(today, 3).map((i) => i.getIngredientId());
        expect(expSoon).toContain("milk");
        expect(expSoon).not.toContain("eggs");
        expect(expSoon).not.toContain("rice");
    });
});
