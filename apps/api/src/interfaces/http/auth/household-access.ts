import { prisma } from "../../../infrastructure/persistence/prisma/prisma-client";

export async function assertHouseholdAccess(userId: string, householdId: string) {
    const m = await prisma.householdMember.findUnique({
        where: { userId_householdId: { userId, householdId } },
        select: { id: true },
    });

    if (!m) throw new Error("HOUSEHOLD_FORBIDDEN");
}
