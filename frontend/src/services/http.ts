// ─── HTTP Client ─────────────────────────────────────────────────────────────
// Base fetch wrapper with typed error handling. All service modules use this.

import { API_BASE_URL } from '../config/api';

export class HttpError extends Error {
  status: number;
  detail?: string;

  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.detail = detail;
  }
}

async function parseErrorResponse(response: Response): Promise<string> {
  const cloned = response.clone();
  try {
    const data = (await cloned.json()) as Record<string, unknown>;
    const msg = [data?.error, data?.detail].find(
      (v): v is string => typeof v === 'string' && v.trim().length > 0
    );
    if (msg) return msg;
    if (Object.keys(data ?? {}).length > 0) return JSON.stringify(data);
  } catch {
    const text = await response.text();
    if (text) return text;
  }
  return `Request failed with status ${response.status}`;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await parseErrorResponse(response);
    throw new HttpError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// ─── HTTP Methods ────────────────────────────────────────────────────────────

export async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
  });
  return handleResponse<T>(response);
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function put<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function patch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function del<T = void>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const text = await response.text();
    throw new HttpError(response.status, text || `DELETE ${path} failed`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function upload<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return handleResponse<T>(response);
}

export async function downloadBlob(path: string, method: 'GET' | 'POST' = 'GET', body?: unknown): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new HttpError(response.status, 'Download failed');
  return response.blob();
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
