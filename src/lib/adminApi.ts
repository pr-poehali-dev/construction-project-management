import { getToken } from "./auth";

const ADMIN_URL = "https://functions.poehali.dev/e5fba739-b93e-42d3-b8a2-d18b83964deb";

export interface UserRecord {
  id: number;
  name: string;
  phone: string;
  role: "foreman" | "engineer" | "admin";
  created_at: string;
}

function authHeaders() {
  return { "Content-Type": "application/json", "X-Auth-Token": getToken() || "" };
}

export async function fetchUsers(): Promise<UserRecord[]> {
  const res = await fetch(`${ADMIN_URL}?action=list`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
  return data.users;
}

export async function createUser(payload: {
  name: string;
  phone: string;
  password: string;
  role: string;
}): Promise<UserRecord> {
  const res = await fetch(`${ADMIN_URL}?action=create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка создания");
  return data.user;
}

export async function updateUser(payload: {
  id: number;
  name: string;
  phone: string;
  role: string;
  password?: string;
}): Promise<void> {
  const res = await fetch(`${ADMIN_URL}?action=update`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка обновления");
}

export async function deleteUser(id: number): Promise<void> {
  const res = await fetch(`${ADMIN_URL}?action=delete&id=${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка удаления");
}
