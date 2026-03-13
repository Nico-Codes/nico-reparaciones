import { apiOrigin, authFetch, authJsonRequest } from '@/features/auth/http';

export const adminApiOrigin = apiOrigin;

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return authJsonRequest<T>(path, init);
}

export const adminAuthRequest = authRequest;

export async function adminAuthFetch(path: string, init?: RequestInit): Promise<Response> {
  return authFetch(path, init);
}

export type AdminDashboardResponse = {
  metrics: {
    products: { total: number; active: number; lowStock: number; outOfStock: number };
    repairs: { open: number; readyPickup: number; createdToday: number };
    orders: { pendingFlow: number; createdToday: number; revenueMonth: number };
  };
  alerts: Array<{ id: string; severity: 'low' | 'medium' | 'high'; title: string; value: number }>;
  recent: {
    orders: Array<{
      id: string;
      status: string;
      total: number;
      createdAt: string;
      user: { id: string; name: string; email: string } | null;
      itemsPreview: Array<{ id: string; name: string; quantity: number; lineTotal: number }>;
    }>;
    repairs: Array<{
      id: string;
      status: string;
      customerName: string;
      deviceBrand: string | null;
      deviceModel: string | null;
      issueLabel: string | null;
      quotedPrice: number | null;
      finalPrice: number | null;
      createdAt: string;
    }>;
  };
  generatedAt: string;
};

export type AdminProviderItem = {
  id: string;
  name: string;
  priority: number;
  phone: string;
  products: number;
  incidents: number;
  warrantiesOk: number;
  warrantiesExpired: number;
  loss: number;
  score: number;
  confidenceLabel: string;
  active: boolean;
  searchEnabled: boolean;
  statusProbe: 'ok' | 'none';
  lastProbeAt: string;
  lastQuery: string;
  lastResults: number;
  mode: string;
  endpoint: string;
  configJson: string;
  notes: string;
};

export type AdminProviderPartSearchItem = {
  externalPartId: string;
  name: string;
  sku: string | null;
  brand: string | null;
  price: number | null;
  availability: 'in_stock' | 'out_of_stock' | 'unknown';
  url: string | null;
  rawLabel: string | null;
};

export type AdminProviderPartSupplierMeta = {
  id: string;
  name: string;
  priority: number;
  endpoint: string | null;
  mode: 'json' | 'html';
};

export type AdminProviderAggregatePartSearchItem = AdminProviderPartSearchItem & {
  supplier: AdminProviderPartSupplierMeta;
};

export type AdminProviderAggregateSearchSupplierItem = {
  supplier: AdminProviderPartSupplierMeta;
  status: 'ok' | 'empty' | 'error';
  total: number;
  error: string | null;
  url: string;
};

export type AdminProviderAggregatePartSearchResult = {
  query: string;
  items: AdminProviderAggregatePartSearchItem[];
  suppliers: AdminProviderAggregateSearchSupplierItem[];
  summary: {
    searchedSuppliers: number;
    suppliersWithResults: number;
    failedSuppliers: number;
    totalResults: number;
  };
};

export type AdminWarrantyItem = {
  id: string;
  sourceType: 'repair' | 'product';
  source: string;
  status: 'open' | 'closed';
  statusLabel: string;
  title: string;
  reason: string;
  repairId: string | null;
  repairCode: string | null;
  customerName: string;
  productId: string | null;
  productName: string;
  providerId: string | null;
  provider: string;
  costSource: string;
  quantity: number;
  unitCost: number;
  cost: number;
  recovered: number;
  loss: number;
  notes: string;
  happenedAt: string;
  date: string;
  time: string;
};

export type AdminAccountingItem = {
  id: string;
  happenedAt: string;
  date: string;
  direction: 'Ingreso' | 'Egreso';
  directionKey: 'inflow' | 'outflow';
  category: string;
  description: string;
  source: string;
  amount: number;
};

export const adminApi = {
  dashboard() {
    return authRequest<AdminDashboardResponse>('/admin/dashboard');
  },
  smtpStatus() {
    return authRequest<{
      smtpDefaultTo: string;
      smtpHealth: {
        status: 'ok' | 'warning' | 'local';
        label: string;
        summary: string;
        mailer: string;
        from_address: string | null;
        from_name: string | null;
        issues: string[];
      };
    }>('/admin/smtp/status');
  },
  smtpTest(email: string) {
    return authRequest<{ ok: boolean; sentTo: string; status: 'sent' | 'dry_run'; smtpHealth: { label: string } }>('/admin/smtp/test', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  deviceTypes() {
    return authRequest<{ items: Array<{ id: string; name: string; slug: string; active: boolean }> }>('/admin/device-types');
  },
  createDeviceType(input: { name: string; active?: boolean }) {
    return authRequest<{ item: { id: string; name: string; slug: string; active: boolean } }>('/admin/device-types', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  updateDeviceType(id: string, input: { name?: string; active?: boolean }) {
    return authRequest<{ item: { id: string; name: string; slug: string; active: boolean } }>(`/admin/device-types/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  modelGroups(deviceBrandId: string) {
    return authRequest<{
      groups: Array<{ id: string; name: string; slug: string; active: boolean }>;
      models: Array<{ id: string; name: string; slug: string; active: boolean; deviceModelGroupId: string | null }>;
    }>(`/admin/model-groups?deviceBrandId=${encodeURIComponent(deviceBrandId)}`);
  },
  createModelGroup(input: { deviceBrandId: string; name: string; active?: boolean }) {
    return authRequest<{ item: { id: string; name: string; slug: string; active: boolean } }>('/admin/model-groups', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  updateModelGroup(id: string, input: { deviceBrandId: string; name?: string; active?: boolean }) {
    return authRequest<{ item: { id: string; name: string; slug: string; active: boolean } }>(`/admin/model-groups/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  assignModelGroup(modelId: string, input: { deviceBrandId: string; deviceModelGroupId?: string | null }) {
    return authRequest<{ ok: boolean }>(`/admin/model-groups/models/${encodeURIComponent(modelId)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  sendWeeklyReportNow(rangeDays?: 7 | 30 | 90) {
    return authRequest<{ ok: boolean; status: string; recipients: string[]; rangeDays: number }>('/admin/reports/weekly/send', {
      method: 'POST',
      body: JSON.stringify(rangeDays ? { rangeDays } : {}),
    });
  },
  sendOperationalAlertsNow() {
    return authRequest<{ ok: boolean; status: string; recipients: string[]; summary: { orders: number; repairs: number } }>(
      '/admin/reports/operational-alerts/send',
      { method: 'POST', body: '{}' },
    );
  },
  providers(params?: { q?: string; active?: '1' | '0' | '' }) {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.active) qs.set('active', params.active);
    return authRequest<{
      items: AdminProviderItem[];
      summary: { total: number; active: number; incidents: number; openIncidents: number; closedIncidents: number; accumulatedLoss: number };
    }>(`/admin/providers${qs.size ? `?${qs.toString()}` : ''}`);
  },
  createProvider(input: {
    name: string;
    phone?: string | null;
    notes?: string | null;
    searchPriority?: number;
    searchEnabled?: boolean;
    searchMode?: 'json' | 'html';
    searchEndpoint?: string | null;
    searchConfigJson?: string | null;
    active?: boolean;
  }) {
    return authRequest<{ item: AdminProviderItem }>('/admin/providers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  updateProvider(
    id: string,
    input: Partial<{
      name: string;
      phone: string | null;
      notes: string | null;
      searchPriority: number;
      searchEnabled: boolean;
      searchMode: 'json' | 'html';
      searchEndpoint: string | null;
      searchConfigJson: string | null;
      active: boolean;
    }>,
  ) {
    return authRequest<{ item: AdminProviderItem }>(`/admin/providers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  toggleProvider(id: string) {
    return authRequest<{ item: AdminProviderItem }>(`/admin/providers/${encodeURIComponent(id)}/toggle`, {
      method: 'POST',
      body: '{}',
    });
  },
  importDefaultProviders() {
    return authRequest<{ created: number; updated: number; items: AdminProviderItem[] }>('/admin/providers/import-defaults', {
      method: 'POST',
      body: '{}',
    });
  },
  reorderProviders(orderedIds: string[]) {
    return authRequest<{ ok: boolean; items: AdminProviderItem[] }>('/admin/providers/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    });
  },
  probeProvider(id: string, q?: string) {
    return authRequest<{ item: AdminProviderItem; probe: { query: string; count: number; url?: string; httpStatus?: number } }>(
      `/admin/providers/${encodeURIComponent(id)}/probe`,
      {
        method: 'POST',
        body: JSON.stringify(q ? { q } : {}),
      },
    );
  },
  searchProviderParts(id: string, input: { q: string; limit?: number }) {
    return authRequest<{
      supplier: AdminProviderItem;
      query: string;
      total: number;
      url: string;
      items: AdminProviderPartSearchItem[];
    }>(`/admin/providers/${encodeURIComponent(id)}/search-parts`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  searchPartsAcrossProviders(input: { q: string; supplierId?: string | null; limitPerSupplier?: number; totalLimit?: number }) {
    return authRequest<AdminProviderAggregatePartSearchResult>('/admin/providers/search-parts', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  warranties(params?: { q?: string; sourceType?: 'repair' | 'product' | ''; status?: 'open' | 'closed' | ''; from?: string; to?: string }) {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.sourceType) qs.set('sourceType', params.sourceType);
    if (params?.status) qs.set('status', params.status);
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    return authRequest<{
      items: AdminWarrantyItem[];
      summary: { totalCount: number; openCount: number; closedCount: number; totalLoss: number };
      supplierStats: Array<{ supplierId: string; name: string; incidentsCount: number; totalLoss: number }>;
    }>(`/admin/warranties${qs.size ? `?${qs.toString()}` : ''}`);
  },
  createWarranty(input: {
    sourceType: 'repair' | 'product';
    title: string;
    reason?: string | null;
    repairId?: string | null;
    productId?: string | null;
    orderId?: string | null;
    supplierId?: string | null;
    quantity: number;
    unitCost?: number | null;
    costOrigin?: 'manual' | 'repair' | 'product';
    extraCost?: number;
    recoveredAmount?: number;
    happenedAt?: string | null;
    notes?: string | null;
  }) {
    return authRequest<{ item: AdminWarrantyItem | null }>('/admin/warranties', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  closeWarranty(id: string) {
    return authRequest<{ item: AdminWarrantyItem | null }>(`/admin/warranties/${encodeURIComponent(id)}/close`, {
      method: 'PATCH',
      body: '{}',
    });
  },
  accounting(params?: { q?: string; direction?: 'inflow' | 'outflow' | ''; category?: string; from?: string; to?: string }) {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.direction) qs.set('direction', params.direction);
    if (params?.category) qs.set('category', params.category);
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    return authRequest<{
      summary: { entriesCount: number; inflowTotal: number; outflowTotal: number; netTotal: number };
      categories: string[];
      categorySummary: Array<{ category: string; entriesCount: number; inflowTotal: number; outflowTotal: number; netTotal: number }>;
      items: AdminAccountingItem[];
      filters: { q: string; direction: '' | 'inflow' | 'outflow'; category: string; from: string; to: string };
    }>(`/admin/accounting${qs.size ? `?${qs.toString()}` : ''}`);
  },
};
