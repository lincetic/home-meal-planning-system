import { describe, expect, it } from "vitest";
import { InventoryItem } from "../inventory-item";
import { Quantity } from "../../value-objects/quantity";

describe("InventoryItem", () => {
    it("requires ingredientId", () => {
        expect(() => new InventoryItem("", Quantity.create(1))).toThrow();
    });

    it("consumes quantity", () => {
        const item = new InventoryItem("milk", Quantity.create(3));

        item.consume(Quantity.create(2));

        expect(item.getQuantity().getValue()).toBe(1);
    });

    it("throws when consuming beyond available quantity", () => {
        const item = new InventoryItem("milk", Quantity.create(1));

        expect(() => item.consume(Quantity.create(2))).toThrow();
    });

    it("adds quantity", () => {
        const item = new InventoryItem("milk", Quantity.create(1));

        item.add(Quantity.create(2));

        expect(item.getQuantity().getValue()).toBe(3);
    });

    it("returns false for expiring soon when there is no expiration date", () => {
        const item = new InventoryItem("rice", Quantity.create(1));

        expect(item.isExpiringSoon(new Date("2026-02-03"))).toBe(false);
    });

    it("returns true when expiration date is within threshold", () => {
        const item = new InventoryItem(
            "milk",
            Quantity.create(1),
            new Date("2026-02-05")
        );

        expect(item.isExpiringSoon(new Date("2026-02-03"), 3)).toBe(true);
    });

    it("returns false when expiration date is outside threshold", () => {
        const item = new InventoryItem(
            "milk",
            Quantity.create(1),
            new Date("2026-02-10")
        );

        expect(item.isExpiringSoon(new Date("2026-02-03"), 3)).toBe(false);
    });
});
