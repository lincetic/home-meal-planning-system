const TOKEN_KEY = "tfm_access_token";

export function setAccessToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export function getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
    // OJO: el endpoint real debe existir en el backend
    const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();
    const token = data?.accessToken;
    if (typeof token !== "string" || token.length === 0) return null;

    setAccessToken(token);
    return token;
}

function parseJsonSafe(text: string) {
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return null;
    }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(init?.headers as any),
    };

    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const doFetch = async () => {
        return fetch(`/api${path}`, {
            ...init,
            headers,
            credentials: "include",
        });
    };

    const res = await doFetch();
    const text = await res.text();
    const data = parseJsonSafe(text);

    if (res.ok) return data as T;

    // 🔐 Si es 401, intentamos refresh UNA vez (si no estamos ya en refresh)
    const isRefreshCall = path.startsWith("/auth/refresh");
    if (res.status === 401 && !isRefreshCall) {
        const newToken = await refreshAccessToken();

        if (newToken) {
            headers["Authorization"] = `Bearer ${newToken}`;

            const retry = await doFetch();
            const textRetry = await retry.text();
            const dataRetry = parseJsonSafe(textRetry);

            if (retry.ok) return dataRetry as T;

            // si incluso el retry falla, cae al error normal
            throw new Error(dataRetry?.error ?? `HTTP ${retry.status}`);
        }

        // refresh falló => cerramos sesión en el front
        clearAccessToken();
        window.dispatchEvent(new Event("auth:expired"));
        throw new Error(data?.error ?? "Unauthorized");
    }

    throw new Error(data?.error ?? `HTTP ${res.status}`);
}