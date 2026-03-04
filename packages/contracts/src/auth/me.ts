import { z } from "zod";
import { zId } from "../common/ids";
import { zAuthUser } from "./shared";

/**
 * /auth/me response:
 * - current user
 * - households where the user is a member (mobile-friendly bootstrap)
 */
export const zMeResponse = z.object({
    user: zAuthUser,
    households: z.array(
        z.object({
            id: zId,
            role: z.enum(["OWNER", "MEMBER"]),
        })
    ),
});

export type MeResponse = z.infer<typeof zMeResponse>;