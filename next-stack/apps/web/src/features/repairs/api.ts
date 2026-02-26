import { authStorage } from '@/features/auth/storage';
import type { PublicRepairLookupItem, RepairItem, RepairTimelineEvent } from './types';

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

async function publicRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.error?.message as string) || (data?.message as string) || `Error ${res.status}`);
  return data as T;
}

export const repairsApi = {
  publicLookup(input: { repairId: string; customerPhone: string }) {
    return publicRequest<{ ok: boolean; found: boolean; message?: string; item?: PublicRepairLookupItem }>('/repairs/lookup', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  my() {
    return authRequest<{ items: RepairItem[] }>('/repairs/my');
  },
  myDetail(id: string) {
    return authRequest<{ item: RepairItem }>('/repairs/my/' + encodeURIComponent(id));
  },
  adminList(params?: { status?: string; q?: string; from?: string; to?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.q) qs.set('q', params.q);
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    return authRequest<{ items: RepairItem[] }>('/repairs/admin' + (qs.size ? `?${qs.toString()}` : ''));
  },
  adminStats() {
    return authRequest<{ total: number; readyPickup: number; deliveredToday: number; byStatus: Record<string, number> }>('/repairs/admin/stats');
  },
  adminDetail(id: string) {
    return authRequest<{ item: RepairItem; timeline?: RepairTimelineEvent[] }>(`/repairs/admin/${encodeURIComponent(id)}`);
  },
  adminCreate(input: Partial<RepairItem> & { customerName: string }) {
    return authRequest<RepairItem>('/repairs/admin', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  adminUpdate(
    id: string,
    input: Partial<Pick<RepairItem, 'customerName' | 'customerPhone' | 'deviceTypeId' | 'deviceBrandId' | 'deviceModelId' | 'deviceIssueTypeId' | 'deviceBrand' | 'deviceModel' | 'issueLabel' | 'quotedPrice' | 'finalPrice' | 'notes' | 'status'>>,
  ) {
    return authRequest<{ item: RepairItem }>(`/repairs/admin/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  adminUpdateStatus(id: string, input: { status: string; finalPrice?: number | null; notes?: string | null }) {
    return authRequest<{ item: RepairItem }>(`/repairs/admin/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  pricingResolve(input: { deviceTypeId?: string; deviceBrandId?: string; deviceModelGroupId?: string; deviceModelId?: string; deviceIssueTypeId?: string; deviceBrand?: string; deviceModel?: string; issueLabel?: string }) {
    const qs = new URLSearchParams();
    if (input.deviceTypeId) qs.set('deviceTypeId', input.deviceTypeId);
    if (input.deviceBrandId) qs.set('deviceBrandId', input.deviceBrandId);
    if (input.deviceModelGroupId) qs.set('deviceModelGroupId', input.deviceModelGroupId);
    if (input.deviceModelId) qs.set('deviceModelId', input.deviceModelId);
    if (input.deviceIssueTypeId) qs.set('deviceIssueTypeId', input.deviceIssueTypeId);
    if (input.deviceBrand) qs.set('deviceBrand', input.deviceBrand);
    if (input.deviceModel) qs.set('deviceModel', input.deviceModel);
    if (input.issueLabel) qs.set('issueLabel', input.issueLabel);
    return authRequest<{
      matched: boolean;
      rule?: { id: string; name: string; basePrice: number; profitPercent: number; priority: number; calcMode?: 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL'; minFinalPrice?: number | null; shippingFee?: number | null; deviceTypeId?: string | null; deviceBrandId?: string | null; deviceModelGroupId?: string | null; deviceModelId?: string | null; deviceIssueTypeId?: string | null };
      suggestion?: { basePrice: number; profitPercent: number; calcMode?: 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL'; minFinalPrice?: number | null; shippingFee?: number | null; suggestedTotal: number };
      input: { deviceTypeId?: string | null; deviceBrandId?: string | null; deviceModelGroupId?: string | null; deviceModelId?: string | null; deviceIssueTypeId?: string | null; deviceBrand: string; deviceModel: string; issueLabel: string };
    }>(`/pricing/repairs/resolve${qs.size ? `?${qs.toString()}` : ''}`);
  },
  pricingRulesList() {
    return authRequest<{ items: Array<{
      id: string;
      name: string;
      active: boolean;
      priority: number;
      deviceTypeId?: string | null;
      deviceBrandId?: string | null;
      deviceModelGroupId?: string | null;
      deviceModelId?: string | null;
      deviceIssueTypeId?: string | null;
      deviceBrand: string | null;
      deviceModel: string | null;
      issueLabel: string | null;
      basePrice: number;
      profitPercent: number;
      calcMode?: 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL';
      minFinalPrice?: number | null;
      shippingFee?: number | null;
      notes: string | null;
    }> }>('/pricing/repairs/rules');
  },
  pricingRulesCreate(input: {
    name: string;
    active?: boolean;
    priority?: number;
    deviceTypeId?: string | null;
    deviceBrandId?: string | null;
    deviceModelGroupId?: string | null;
    deviceModelId?: string | null;
    deviceIssueTypeId?: string | null;
    deviceBrand?: string | null;
    deviceModel?: string | null;
    issueLabel?: string | null;
    basePrice: number;
    profitPercent?: number;
    calcMode?: 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL';
    minFinalPrice?: number | null;
    shippingFee?: number | null;
    notes?: string | null;
  }) {
    return authRequest<{ item: unknown }>('/pricing/repairs/rules', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  pricingRulesUpdate(
    id: string,
    input: Partial<{
      name: string;
      active: boolean;
      priority: number;
      deviceTypeId?: string | null;
      deviceBrandId?: string | null;
      deviceModelGroupId?: string | null;
      deviceModelId?: string | null;
      deviceIssueTypeId?: string | null;
      deviceBrand?: string | null;
      deviceModel?: string | null;
      issueLabel?: string | null;
      basePrice: number;
      profitPercent?: number;
      calcMode?: 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL';
      minFinalPrice?: number | null;
      shippingFee?: number | null;
      notes?: string | null;
    }>,
  ) {
    return authRequest<{ item: unknown }>(`/pricing/repairs/rules/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  pricingRulesDelete(id: string) {
    return authRequest<{ ok: boolean }>(`/pricing/repairs/rules/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};
