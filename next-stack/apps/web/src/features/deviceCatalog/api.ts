import { authStorage } from '@/features/auth/storage';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
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

export const deviceCatalogApi = {
  brands(deviceTypeId?: string) {
    return req<{ items: Array<{ id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean }> }>(
      `/device-catalog/brands${deviceTypeId ? `?deviceTypeId=${encodeURIComponent(deviceTypeId)}` : ''}`,
    );
  },
  models(brandId?: string) {
    return req<{ items: Array<{ id: string; brandId: string; deviceModelGroupId?: string | null; name: string; slug: string; active: boolean; brand: { id: string; name: string; slug: string } }> }>(
      `/device-catalog/models${brandId ? `?brandId=${encodeURIComponent(brandId)}` : ''}`,
    );
  },
  issues(deviceTypeId?: string) {
    return req<{ items: Array<{ id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean }> }>(
      `/device-catalog/issues${deviceTypeId ? `?deviceTypeId=${encodeURIComponent(deviceTypeId)}` : ''}`,
    );
  },
  createBrand(input: { deviceTypeId?: string | null; name: string; slug: string; active?: boolean }) {
    return req('/device-catalog/brands', { method: 'POST', body: JSON.stringify(input) });
  },
  updateBrand(id: string, input: { deviceTypeId?: string | null; name?: string; slug?: string; active?: boolean }) {
    return req(`/device-catalog/brands/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  createModel(input: { brandId: string; name: string; slug: string }) {
    return req('/device-catalog/models', { method: 'POST', body: JSON.stringify(input) });
  },
  updateModel(id: string, input: { brandId?: string; name?: string; slug?: string; active?: boolean }) {
    return req(`/device-catalog/models/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  createIssue(input: { deviceTypeId?: string | null; name: string; slug: string; active?: boolean }) {
    return req('/device-catalog/issues', { method: 'POST', body: JSON.stringify(input) });
  },
  updateIssue(id: string, input: { deviceTypeId?: string | null; name?: string; slug?: string; active?: boolean }) {
    return req(`/device-catalog/issues/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  deleteBrand(id: string) {
    return req(`/device-catalog/brands/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  deleteModel(id: string) {
    return req(`/device-catalog/models/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  deleteIssue(id: string) {
    return req(`/device-catalog/issues/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};
