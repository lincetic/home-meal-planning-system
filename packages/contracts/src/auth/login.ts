import { z } from "zod";
import { zAuthUser, zEmail, zPassword } from "./shared";

/**
 * Login request.
 */
export const zLoginRequest = z.object({
    email: zEmail,
    password: zPassword,
});

/**
 * Login response.
 */
export const zLoginResponse = z.object({
    user: zAuthUser,
    accessToken: z.string().min(20),
});

export type LoginRequest = z.infer<typeof zLoginRequest>;
export type LoginResponse = z.infer<typeof zLoginResponse>;