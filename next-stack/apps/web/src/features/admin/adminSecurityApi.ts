import { authStorage } from '@/features/auth/storage';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = authStorage.getAccessToken();
  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.message as string) || `Error ${res.status}`);
  return data as T;
}

export type AdminTwoFactorStatus = {
  enabled: boolean;
  hasSecret: boolean;
  hasPendingSecret: boolean;
  accountEmail: string;
  otpauthUrl: string | null;
  pendingSecretMasked: string | null;
};

export const adminSecurityApi = {
  twoFactorStatus() {
    return authRequest<AdminTwoFactorStatus>('/admin/security/2fa');
  },
  twoFactorGenerate() {
    return authRequest<{ ok: boolean; secret: string; secretMasked: string; otpauthUrl: string; accountEmail: string }>(
      '/admin/security/2fa/generate',
      { method: 'POST' },
    );
  },
  twoFactorEnable(code: string) {
    return authRequest<{ ok: boolean; enabled: boolean }>('/admin/security/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },
  twoFactorDisable(code?: string) {
    return authRequest<{ ok: boolean; enabled: boolean }>('/admin/security/2fa/disable', {
      method: 'POST',
      body: JSON.stringify(code ? { code } : {}),
    });
  },
};

