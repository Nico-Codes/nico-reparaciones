import { authJsonRequest, publicJsonRequest } from '@/features/auth/http';
import type { PublicRepairLookupItem, PublicRepairQuoteApprovalItem, RepairItem, RepairTimelineEvent } from './types';

export const repairsApi = {
  publicLookup(input: { repairId: string; customerPhone: string }) {
    return publicJsonRequest<{ ok: boolean; found: boolean; message?: string; item?: PublicRepairLookupItem }>('/repairs/lookup', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  publicQuoteApproval(id: string, token: string) {
    const qs = new URLSearchParams({ token: token.trim() });
    return publicJsonRequest<{ ok: boolean; canDecide: boolean; item: PublicRepairQuoteApprovalItem }>(
      `/repairs/${encodeURIComponent(id)}/quote-approval?${qs.toString()}`,
    );
  },
  publicQuoteApprove(id: string, token: string) {
    return publicJsonRequest<{ ok: boolean; changed: boolean; canDecide: boolean; message: string; item: PublicRepairQuoteApprovalItem }>(
      `/repairs/${encodeURIComponent(id)}/quote-approval/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ token }),
      },
    );
  },
  publicQuoteReject(id: string, token: string) {
    return publicJsonRequest<{ ok: boolean; changed: boolean; canDecide: boolean; message: string; item: PublicRepairQuoteApprovalItem }>(
      `/repairs/${encodeURIComponent(id)}/quote-approval/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ token }),
      },
    );
  },
  my() {
    return authJsonRequest<{ items: RepairItem[] }>('/repairs/my');
  },
  myDetail(id: string) {
    return authJsonRequest<{ item: RepairItem }>('/repairs/my/' + encodeURIComponent(id));
  },
  adminList(params?: { status?: string; q?: string; from?: string; to?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.q) qs.set('q', params.q);
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    return authJsonRequest<{ items: RepairItem[] }>('/repairs/admin' + (qs.size ? `?${qs.toString()}` : ''));
  },
  adminStats() {
    return authJsonRequest<{ total: number; readyPickup: number; deliveredToday: number; byStatus: Record<string, number> }>('/repairs/admin/stats');
  },
  adminDetail(id: string) {
    return authJsonRequest<{ item: RepairItem; timeline?: RepairTimelineEvent[] }>(`/repairs/admin/${encodeURIComponent(id)}`);
  },
  adminCreate(input: Partial<RepairItem> & { customerName: string }) {
    return authJsonRequest<RepairItem>('/repairs/admin', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  adminUpdate(
    id: string,
    input: Partial<Pick<RepairItem, 'customerName' | 'customerPhone' | 'deviceTypeId' | 'deviceBrandId' | 'deviceModelId' | 'deviceIssueTypeId' | 'deviceBrand' | 'deviceModel' | 'issueLabel' | 'quotedPrice' | 'finalPrice' | 'notes' | 'status'>>,
  ) {
    return authJsonRequest<{ item: RepairItem }>(`/repairs/admin/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  adminUpdateStatus(id: string, input: { status: string; finalPrice?: number | null; notes?: string | null }) {
    return authJsonRequest<{ item: RepairItem }>(`/repairs/admin/${encodeURIComponent(id)}/status`, {
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
    return authJsonRequest<{
      matched: boolean;
      rule?: { id: string; name: string; basePrice: number; profitPercent: number; priority: number; calcMode?: 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL'; minProfit?: number | null; minFinalPrice?: number | null; shippingFee?: number | null; deviceTypeId?: string | null; deviceBrandId?: string | null; deviceModelGroupId?: string | null; deviceModelId?: string | null; deviceIssueTypeId?: string | null };
      suggestion?: { basePrice: number; profitPercent: number; calcMode?: 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL'; minProfit?: number | null; minFinalPrice?: number | null; shippingFee?: number | null; suggestedTotal: number };
      input: { deviceTypeId?: string | null; deviceBrandId?: string | null; deviceModelGroupId?: string | null; deviceModelId?: string | null; deviceIssueTypeId?: string | null; deviceBrand: string; deviceModel: string; issueLabel: string };
    }>(`/pricing/repairs/resolve${qs.size ? `?${qs.toString()}` : ''}`);
  },
  pricingRulesList() {
    return authJsonRequest<{ items: Array<{
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
      minProfit?: number | null;
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
    minProfit?: number | null;
    minFinalPrice?: number | null;
    shippingFee?: number | null;
    mode?: 'margin' | 'fixed';
    multiplier?: number | null;
    min_profit?: number | null;
    fixed_total?: number | null;
    shipping_default?: number | null;
    notes?: string | null;
  }) {
    return authJsonRequest<{ item: unknown }>('/pricing/repairs/rules', {
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
      minProfit?: number | null;
      minFinalPrice?: number | null;
      shippingFee?: number | null;
      mode?: 'margin' | 'fixed';
      multiplier?: number | null;
      min_profit?: number | null;
      fixed_total?: number | null;
      shipping_default?: number | null;
      notes?: string | null;
    }>,
  ) {
    return authJsonRequest<{ item: unknown }>(`/pricing/repairs/rules/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  pricingRulesDelete(id: string) {
    return authJsonRequest<{ ok: boolean }>(`/pricing/repairs/rules/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};
