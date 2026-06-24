const TOKEN_KEY = "tfm_access_token";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

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
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();
    setAccessToken(data.accessToken);
    return data.accessToken;
}

function buildUrl(path: string) {
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${API_BASE_URL}${path}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const token = getAccessToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(init?.headers as Record<string, string> | undefined),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const doFetch = () =>
        fetch(buildUrl(path), {
            ...init,
            headers,
            credentials: "include",
        });

    const res = await doFetch();
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
        if (res.status === 401) {
            const newToken = await refreshAccessToken();

            if (newToken) {
                headers["Authorization"] = `Bearer ${newToken}`;

                const retry = await doFetch();
                const textRetry = await retry.text();
                const dataRetry = textRetry ? JSON.parse(textRetry) : null;

                if (!retry.ok) throw new Error(dataRetry?.error ?? `HTTP ${retry.status}`);

                return dataRetry as T;
            }

            clearAccessToken();
            window.dispatchEvent(new Event("auth:expired"));
        }

        throw new Error(data?.error ?? `HTTP ${res.status}`);
    }

    return data as T;
}
