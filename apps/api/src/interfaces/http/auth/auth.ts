import { FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

export type AuthContext = { userId: string };

export function requireAuth(request: FastifyRequest): AuthContext {
    const hdr = request.headers.authorization;
    if (!hdr || !hdr.startsWith("Bearer ")) {
        throw new Error("AUTH_MISSING");
    }

    const token = hdr.slice("Bearer ".length).trim();
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const sub = payload?.sub;
        if (!sub) throw new Error("AUTH_INVALID");
        return { userId: String(sub) };
    } catch {
        throw new Error("AUTH_INVALID");
    }
}
