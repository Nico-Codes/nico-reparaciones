import { adminApiOrigin, adminAuthFetch } from './api';

export type BrandAssetUploadResult = {
  ok: boolean;
  slot: string;
  settingKey: string;
  path: string;
  url: string | null;
};

export type BrandAssetVersionItem = {
  id: string;
  slot: string;
  path: string;
  url: string | null;
  originalName: string | null;
  mimeType: string | null;
  size: number | null;
  source: string;
  isActive: boolean;
  createdAt: string | null;
};

export type BrandAssetVersionsResponse = {
  slot: string;
  settingKey: string;
  defaultPath: string;
  activePath: string;
  items: BrandAssetVersionItem[];
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

  async versions(slot: string) {
    const res = await adminAuthFetch(`/admin/brand-assets/${encodeURIComponent(slot)}/versions`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data?.message as string) || `Error ${res.status}`);
    return data as BrandAssetVersionsResponse;
  },

  async activateVersion(slot: string, versionId: string) {
    const res = await adminAuthFetch(
      `/admin/brand-assets/${encodeURIComponent(slot)}/versions/${encodeURIComponent(versionId)}/activate`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      },
    );
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
