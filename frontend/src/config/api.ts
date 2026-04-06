// ─── API Configuration ───────────────────────────────────────────────────────

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function isLikelyLocalUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);
  } catch {
    return value.startsWith('http://localhost') || value.startsWith('http://127.0.0.1');
  }
}

function resolveDefaultApiBase(): string {
  if (import.meta.env.DEV) return 'http://localhost:8000/api';
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api`;
  }
  return '/api';
}

const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();
const shouldUseConfiguredBase =
  configuredBase && (import.meta.env.DEV || !isLikelyLocalUrl(configuredBase));

export const API_BASE_URL = normalizeBaseUrl(
  shouldUseConfiguredBase ? configuredBase! : resolveDefaultApiBase()
);
