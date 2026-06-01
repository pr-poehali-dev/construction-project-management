const AUTH_URL = "https://functions.poehali.dev/3be42d97-1a5c-4b9e-96aa-a318de37738c";
const TOKEN_KEY = "sk_token";

export interface User {
  id: number;
  name: string;
  role: "foreman" | "engineer" | "admin";
  phone: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiLogin(phone: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${AUTH_URL}?action=login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка входа");
  return data;
}

export async function apiMe(): Promise<User | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${AUTH_URL}?action=me`, {
    headers: { "X-Auth-Token": token },
  });
  if (!res.ok) {
    clearToken();
    return null;
  }
  const data = await res.json();
  return data.user;
}

export async function apiLogout(): Promise<void> {
  const token = getToken();
  if (!token) return;
  await fetch(`${AUTH_URL}?action=logout`, {
    method: "POST",
    headers: { "X-Auth-Token": token },
  });
  clearToken();
}
