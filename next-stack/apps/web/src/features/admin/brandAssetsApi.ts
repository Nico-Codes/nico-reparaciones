import { adminApiOrigin, adminAuthFetch } from './api';

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
    const res = await adminAuthFetch(`/admin/brand-assets/upload/${encodeURIComponent(slot)}`, {
      method: 'POST',
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data?.message as string) || `Error ${res.status}`);
    return data as BrandAssetUploadResult;
  },

  async reset(slot: string) {
    const res = await adminAuthFetch(`/admin/brand-assets/reset/${encodeURIComponent(slot)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data?.message as string) || `Error ${res.status}`);
    return data as BrandAssetUploadResult;
  },

  toApiAssetUrl(pathValue?: string | null, updatedAt?: string | null) {
    const raw = (pathValue ?? '').trim();
    if (!raw) return null;
    const normalizedPath = `/${raw.replace(/^\/+/, '')}`;
    const normalizedUrl = /^https?:\/\//i.test(raw)
      ? raw
      : normalizedPath.startsWith('/brand-assets/') || normalizedPath.startsWith('/storage/')
        ? `${adminApiOrigin.replace(/\/+$/, '')}${normalizedPath}`
        : normalizedPath;
    const version = Date.parse((updatedAt ?? '').trim());
    if (!Number.isFinite(version)) return normalizedUrl;
    return `${normalizedUrl}${normalizedUrl.includes('?') ? '&' : '?'}v=${version}`;
  },
};
