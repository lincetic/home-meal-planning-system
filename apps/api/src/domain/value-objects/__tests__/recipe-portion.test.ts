import { describe, expect, it } from "vitest";
import { RecipePortion } from "../recipe-portion";

describe("RecipePortion", () => {
    it("creates a full portion", () => {
        const portion = RecipePortion.create("FULL");

        expect(portion.getValue()).toBe("FULL");
        expect(portion.getMultiplier()).toBe(1);
    });

    it("creates a half portion", () => {
        const portion = RecipePortion.create("HALF");

        expect(portion.getValue()).toBe("HALF");
        expect(portion.getMultiplier()).toBe(0.5);
    });

    it("rejects unsupported portions", () => {
        expect(() => RecipePortion.create("QUARTER" as "FULL")).toThrow(
            "Unsupported recipe portion"
        );
    });
});
