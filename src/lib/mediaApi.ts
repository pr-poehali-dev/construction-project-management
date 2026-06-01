import { getToken } from "./auth";

const PHOTOS_URL = "https://functions.poehali.dev/c0a1fec3-8756-43c0-8494-7b2bc060ef1e";
const VOLUMES_URL = "https://functions.poehali.dev/4b377548-458a-42ba-bcf5-f5b650a87c8d";

function authHeaders() {
  return { "Content-Type": "application/json", "X-Auth-Token": getToken() || "" };
}

// ──── PHOTOS ────────────────────────────────────────────────────

export interface Photo {
  id: number;
  user_name: string;
  category: string;
  caption: string;
  cdn_url: string;
  created_at: string;
}

export async function uploadPhoto(
  fileBase64: string,
  contentType: string,
  category: string,
  caption: string
): Promise<Photo> {
  const res = await fetch(`${PHOTOS_URL}?action=upload`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ file: fileBase64, content_type: contentType, category, caption }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка загрузки фото");
  return data.photo;
}

export async function fetchPhotos(category?: string): Promise<{ photos: Photo[]; categories: Record<string, string> }> {
  const url = category ? `${PHOTOS_URL}?action=list&category=${category}` : `${PHOTOS_URL}?action=list`;
  const res = await fetch(url, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
  return data;
}

// Конвертация File -> base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ──── WORK VOLUMES ───────────────────────────────────────────────

export interface WorkVolume {
  id: number;
  work_date: string;
  user_name: string;
  work_name: string;
  unit: string;
  volume: number;
  location: string;
  note: string;
  created_at: string;
}

export async function addWorkVolume(payload: {
  work_date: string;
  work_name: string;
  unit: string;
  volume: number;
  location?: string;
  note?: string;
}): Promise<{ id: number; work_date: string }> {
  const res = await fetch(`${VOLUMES_URL}?action=add`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка сохранения");
  return data;
}

export async function fetchWorkVolumes(): Promise<{ items: WorkVolume[]; cumulative: Record<string, number> }> {
  const res = await fetch(`${VOLUMES_URL}?action=list`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
  return data;
}

export function getExcelUrl(): string {
  return `${VOLUMES_URL}?action=export`;
}

export function getExcelHeaders(): Record<string, string> {
  return { "X-Auth-Token": getToken() || "" };
}
