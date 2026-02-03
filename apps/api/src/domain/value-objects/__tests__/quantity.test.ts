import { describe, it, expect } from "vitest";
import { Quantity } from "../quantity";

describe("Quantity", () => {
    it("crea una cantidad válida (>= 0)", () => {
        const q = Quantity.create(5);
        expect(q.getValue()).toBe(5);
    });

    it("no permite cantidades negativas", () => {
        expect(() => Quantity.create(-1)).toThrow();
    });

    it("suma cantidades correctamente", () => {
        const a = Quantity.create(2);
        const b = Quantity.create(3);
        expect(a.add(b).getValue()).toBe(5);
    });

    it("resta cantidades correctamente", () => {
        const a = Quantity.create(5);
        const b = Quantity.create(2);
        expect(a.subtract(b).getValue()).toBe(3);
    });

    it("no permite que la resta deje negativo", () => {
        const a = Quantity.create(1);
        const b = Quantity.create(2);
        expect(() => a.subtract(b)).toThrow();
    });
});
