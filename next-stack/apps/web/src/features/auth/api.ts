import type { AuthResponse } from './types';
import { authStorage } from './storage';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

type ApiError = {
  message: string;
  details?: unknown;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (typeof data?.message === 'string' && data.message) ||
      (typeof data?.error === 'string' && data.error) ||
      `Error ${res.status}`;
    const error: ApiError = { message, details: data };
    throw error;
  }

  return data as T;
}

export const authApi = {
  register(input: { name: string; email: string; password: string }) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  login(input: { email: string; password: string }) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  me(accessToken?: string) {
    const token = accessToken ?? authStorage.getAccessToken();
    return request<{ user: AuthResponse['user'] }>('/auth/me', {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  refresh(refreshToken?: string) {
    const token = refreshToken ?? authStorage.getRefreshToken();
    return request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: token }),
    });
  },
  forgotPassword(email: string) {
    return request<{ ok: boolean; message: string; previewToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  resetPassword(input: { token: string; password: string }) {
    return request<{ ok: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  requestVerifyEmail() {
    const token = authStorage.getAccessToken();
    return request<{ ok: boolean; status: string; previewToken?: string }>('/auth/verify-email/request', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  confirmVerifyEmail(token: string) {
    return request<{ ok: boolean; message: string }>('/auth/verify-email/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
  bootstrapAdmin(input: { setupKey: string; name: string; email: string; password: string }) {
    return request<AuthResponse & { ok: boolean; message: string }>('/auth/bootstrap-admin', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
