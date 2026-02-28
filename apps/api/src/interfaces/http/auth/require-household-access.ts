import type { FastifyRequest } from "fastify";
import { prisma } from "../../../infrastructure/persistence/prisma/prisma-client";
import { requireAuth } from "./auth";

export async function requireHouseholdAccess(request: FastifyRequest, householdId: string) {
    const { userId } = requireAuth(request);

    const member = await prisma.householdMember.findUnique({
        where: { userId_householdId: { userId, householdId } },
        select: { userId: true },
    });

    if (!member) {
        throw new Error("HOUSEHOLD_FORBIDDEN");
    }

    return { userId };
}