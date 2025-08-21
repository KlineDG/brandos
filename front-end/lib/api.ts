// Minimal fetch wrapper with auth.
// Set NEXT_PUBLIC_API_BASE_URL="http://localhost:3001" in .env.local

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

type ReqInit = Omit<RequestInit, "headers" | "body"> & {
  token?: string | null;
  json?: unknown;
};

async function request<T>(path: string, init: ReqInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (init.token) headers.Authorization = `Bearer ${init.token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status} ${res.statusText}`);
  }
  // some endpoints might return empty 204
  if (res.status === 204) return {} as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { token }),
  post: <T>(path: string, json?: unknown, token?: string | null) =>
    request<T>(path, { method: "POST", json, token }),
};
