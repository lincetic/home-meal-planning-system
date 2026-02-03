import { z } from "zod";

/**
 * ID estándar del sistema.
 * En el MVP usamos UUID como string.
 */
export const zId = z.string().uuid();

/**
 * Tipo TypeScript inferido desde Zod
 */
export type Id = z.infer<typeof zId>;
