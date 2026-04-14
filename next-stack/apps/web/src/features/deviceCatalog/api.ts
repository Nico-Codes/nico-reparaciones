import { authJsonRequest } from '@/features/auth/http';

export const deviceCatalogApi = {
  brands(deviceTypeId?: string) {
    return authJsonRequest<{ items: Array<{ id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean }> }>(
      `/device-catalog/brands${deviceTypeId ? `?deviceTypeId=${encodeURIComponent(deviceTypeId)}` : ''}`,
    );
  },
  models(brandId?: string) {
    return authJsonRequest<{ items: Array<{ id: string; brandId: string; deviceModelGroupId?: string | null; name: string; slug: string; active: boolean; brand: { id: string; name: string; slug: string } }> }>(
      `/device-catalog/models${brandId ? `?brandId=${encodeURIComponent(brandId)}` : ''}`,
    );
  },
  issues(deviceTypeId?: string) {
    return authJsonRequest<{ items: Array<{ id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean }> }>(
      `/device-catalog/issues${deviceTypeId ? `?deviceTypeId=${encodeURIComponent(deviceTypeId)}` : ''}`,
    );
  },
  createBrand(input: { deviceTypeId?: string | null; name: string; slug: string; active?: boolean }) {
    return authJsonRequest<{ item: { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean } }>(
      '/device-catalog/brands',
      { method: 'POST', body: JSON.stringify(input) },
    );
  },
  updateBrand(id: string, input: { deviceTypeId?: string | null; name?: string; slug?: string; active?: boolean }) {
    return authJsonRequest(`/device-catalog/brands/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  createModel(input: { brandId: string; name: string; slug: string }) {
    return authJsonRequest<{ item: { id: string; brandId: string; name: string; slug: string; active: boolean } }>(
      '/device-catalog/models',
      { method: 'POST', body: JSON.stringify(input) },
    );
  },
  updateModel(id: string, input: { brandId?: string; name?: string; slug?: string; active?: boolean }) {
    return authJsonRequest(`/device-catalog/models/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  createIssue(input: { deviceTypeId?: string | null; name: string; slug: string; active?: boolean }) {
    return authJsonRequest<{ item: { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean } }>(
      '/device-catalog/issues',
      { method: 'POST', body: JSON.stringify(input) },
    );
  },
  updateIssue(id: string, input: { deviceTypeId?: string | null; name?: string; slug?: string; active?: boolean }) {
    return authJsonRequest(`/device-catalog/issues/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  deleteBrand(id: string) {
    return authJsonRequest(`/device-catalog/brands/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  deleteModel(id: string) {
    return authJsonRequest(`/device-catalog/models/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  deleteIssue(id: string) {
    return authJsonRequest(`/device-catalog/issues/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};
