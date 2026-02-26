import { authStorage } from '@/features/auth/storage';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

function authHeaders() {
  const token = authStorage.getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers as HeadersInit;
}

export type BrandAssetUploadResult = {
  ok: boolean;
  slot: string;
  settingKey: string;
  path: string;
  url: string | null;
};

export const brandAssetsApi = {
  async upload(slot: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_URL}/api/admin/brand-assets/upload/${encodeURIComponent(slot)}`, {
      method: 'POST',
      headers: { ...authHeaders() },
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data?.message as string) || `Error ${res.status}`);
    return data as BrandAssetUploadResult;
  },

  async reset(slot: string) {
    const res = await fetch(`${API_URL}/api/admin/brand-assets/reset/${encodeURIComponent(slot)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data?.message as string) || `Error ${res.status}`);
    return data as BrandAssetUploadResult;
  },

  toApiAssetUrl(pathValue?: string | null) {
    const raw = (pathValue ?? '').trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    return `${API_URL.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`;
  },
};
