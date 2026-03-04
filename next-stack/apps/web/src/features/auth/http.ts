import type { AuthResponse } from './types';
import { authStorage } from './storage';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';
export const apiOrigin = API_URL;

let refreshInFlight: Promise<AuthResponse> | null = null;

function apiUrl(path: string) {
  return `${API_URL}/api${path}`;
}

async function requestWithAuth(path: string, init?: RequestInit): Promise<Response> {
  const token = authStorage.getAccessToken();
  const headers = new Headers(init?.headers ?? {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(apiUrl(path), { ...init, headers });
}

async function refreshSession() {
  if (!refreshInFlight) {
    const refreshToken = authStorage.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');
    refreshInFlight = fetch(apiUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message = (typeof data?.message === 'string' && data.message) || `Error ${res.status}`;
          throw new Error(message);
        }
        return data as AuthResponse;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  const refreshed = await refreshInFlight;
  authStorage.setSession(refreshed.user, refreshed.tokens);
}

function resolveErrorMessage(data: unknown, status: number) {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message.trim()) return record.message;
    if (record.error && typeof record.error === 'object' && typeof (record.error as { message?: unknown }).message === 'string') {
      return (record.error as { message: string }).message;
    }
    if (typeof record.error === 'string' && record.error.trim()) return record.error;
  }
  return `Error ${status}`;
}

export async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const first = await requestWithAuth(path, init);
  if (first.status !== 401 || !authStorage.getRefreshToken()) {
    return first;
  }

  try {
    await refreshSession();
    return requestWithAuth(path, init);
  } catch {
    authStorage.clear();
    throw new Error('Sesion vencida. Ingresa nuevamente.');
  }
}

export async function authJsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const res = await authFetch(path, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(resolveErrorMessage(data, res.status));
  return data as T;
}

export async function publicJsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const res = await fetch(apiUrl(path), { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(resolveErrorMessage(data, res.status));
  return data as T;
}

