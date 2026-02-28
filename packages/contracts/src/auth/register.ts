import { z } from "zod";
import { zAuthUser, zEmail, zPassword } from "./shared";

/**
 * Register request.
 */
export const zRegisterRequest = z.object({
    email: zEmail,
    password: zPassword,
    name: z.string().min(1).optional(),
});

/**
 * Register response: user + access token.
 */
export const zRegisterResponse = z.object({
    user: zAuthUser,
    accessToken: z.string().min(20),
});

export type RegisterRequest = z.infer<typeof zRegisterRequest>;
export type RegisterResponse = z.infer<typeof zRegisterResponse>;
