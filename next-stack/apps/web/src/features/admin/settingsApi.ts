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

export type AdminSettingItem = {
  id: string | null;
  key: string;
  value: string;
  group: string;
  label: string | null;
  type: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export const adminSettingsApi = {
  list() {
    return authRequest<{ items: AdminSettingItem[] }>('/admin/settings');
  },
  save(items: Array<Pick<AdminSettingItem, 'key' | 'value' | 'group' | 'label' | 'type'>>) {
    return authRequest<{ items: AdminSettingItem[] }>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    });
  },
};

