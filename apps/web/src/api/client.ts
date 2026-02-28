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

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const token = getAccessToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(init?.headers as any),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`/api${path}`, {
        ...init,
        headers,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
    return data as T;
}
