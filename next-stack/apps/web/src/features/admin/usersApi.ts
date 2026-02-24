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

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export const adminUsersApi = {
  list(params?: { q?: string; role?: string }) {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.role) qs.set('role', params.role);
    return authRequest<{ items: AdminUserRow[] }>(`/admin/users${qs.size ? `?${qs.toString()}` : ''}`);
  },
  updateRole(id: string, role: 'USER' | 'ADMIN') {
    return authRequest<{ item?: AdminUserRow; message?: string }>(`/admin/users/${encodeURIComponent(id)}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },
};

