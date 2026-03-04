import { z } from "zod";
import { zId } from "../common/ids";

/**
 * Valid email.
 */
export const zEmail = z.string().email();

/**
 * MVP password rules.
 * - min 8 chars
 * - max 72 chars (safe upper bound for many password hashers)
 */
export const zPassword = z.string().min(8).max(72);

/**
 * Public user payload returned by the API.
 */
export const zAuthUser = z.object({
    id: zId,
    email: zEmail,
    name: z.string().min(1).nullable().optional(),
});

export type Email = z.infer<typeof zEmail>;
export type Password = z.infer<typeof zPassword>;
export type AuthUser = z.infer<typeof zAuthUser>;