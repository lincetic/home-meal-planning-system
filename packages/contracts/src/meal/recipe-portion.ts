import { z } from "zod";

export const zRecipePortion = z.enum(["FULL", "HALF"]);

export type RecipePortion = z.infer<typeof zRecipePortion>;
