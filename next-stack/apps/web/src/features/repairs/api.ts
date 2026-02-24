import { authStorage } from '@/features/auth/storage';
import type { RepairItem } from './types';

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

export const repairsApi = {
  my() {
    return authRequest<{ items: RepairItem[] }>('/repairs/my');
  },
  myDetail(id: string) {
    return authRequest<{ item: RepairItem }>('/repairs/my/' + encodeURIComponent(id));
  },
  adminList(params?: { status?: string; q?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.q) qs.set('q', params.q);
    return authRequest<{ items: RepairItem[] }>('/repairs/admin' + (qs.size ? `?${qs.toString()}` : ''));
  },
  adminDetail(id: string) {
    return authRequest<{ item: RepairItem }>(`/repairs/admin/${encodeURIComponent(id)}`);
  },
  adminCreate(input: Partial<RepairItem> & { customerName: string }) {
    return authRequest<RepairItem>('/repairs/admin', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  adminUpdate(
    id: string,
    input: Partial<Pick<RepairItem, 'customerName' | 'customerPhone' | 'deviceBrandId' | 'deviceModelId' | 'deviceIssueTypeId' | 'deviceBrand' | 'deviceModel' | 'issueLabel' | 'quotedPrice' | 'finalPrice' | 'notes' | 'status'>>,
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
  pricingResolve(input: { deviceBrandId?: string; deviceModelId?: string; deviceIssueTypeId?: string; deviceBrand?: string; deviceModel?: string; issueLabel?: string }) {
    const qs = new URLSearchParams();
    if (input.deviceBrandId) qs.set('deviceBrandId', input.deviceBrandId);
    if (input.deviceModelId) qs.set('deviceModelId', input.deviceModelId);
    if (input.deviceIssueTypeId) qs.set('deviceIssueTypeId', input.deviceIssueTypeId);
    if (input.deviceBrand) qs.set('deviceBrand', input.deviceBrand);
    if (input.deviceModel) qs.set('deviceModel', input.deviceModel);
    if (input.issueLabel) qs.set('issueLabel', input.issueLabel);
    return authRequest<{
      matched: boolean;
      rule?: { id: string; name: string; basePrice: number; profitPercent: number; priority: number; deviceBrandId?: string | null; deviceModelId?: string | null; deviceIssueTypeId?: string | null };
      suggestion?: { basePrice: number; profitPercent: number; suggestedTotal: number };
      input: { deviceBrandId?: string | null; deviceModelId?: string | null; deviceIssueTypeId?: string | null; deviceBrand: string; deviceModel: string; issueLabel: string };
    }>(`/pricing/repairs/resolve${qs.size ? `?${qs.toString()}` : ''}`);
  },
  pricingRulesList() {
    return authRequest<{ items: Array<{
      id: string;
      name: string;
      active: boolean;
      priority: number;
      deviceBrandId?: string | null;
      deviceModelId?: string | null;
      deviceIssueTypeId?: string | null;
      deviceBrand: string | null;
      deviceModel: string | null;
      issueLabel: string | null;
      basePrice: number;
      profitPercent: number;
      notes: string | null;
    }> }>('/pricing/repairs/rules');
  },
  pricingRulesCreate(input: {
    name: string;
    active?: boolean;
    priority?: number;
    deviceBrandId?: string | null;
    deviceModelId?: string | null;
    deviceIssueTypeId?: string | null;
    deviceBrand?: string | null;
    deviceModel?: string | null;
    issueLabel?: string | null;
    basePrice: number;
    profitPercent?: number;
    notes?: string | null;
  }) {
    return authRequest<{ item: unknown }>('/pricing/repairs/rules', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  pricingRulesDelete(id: string) {
    return authRequest<{ ok: boolean }>(`/pricing/repairs/rules/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};
