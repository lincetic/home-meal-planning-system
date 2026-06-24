export type RecipePortionValue = "FULL" | "HALF";

export class RecipePortion {
    private constructor(private readonly value: RecipePortionValue) { }

    static create(value: string): RecipePortion {
        if (value !== "FULL" && value !== "HALF") {
            throw new Error("Unsupported recipe portion");
        }

        return new RecipePortion(value);
    }

    getValue(): RecipePortionValue {
        return this.value;
    }

    getMultiplier(): number {
        return this.value === "FULL" ? 1 : 0.5;
    }
}
