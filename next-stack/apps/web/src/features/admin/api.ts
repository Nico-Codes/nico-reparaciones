import { authApi } from '@/features/auth/api';
import { authStorage } from '@/features/auth/storage';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';
let refreshInFlight: ReturnType<typeof authApi.refresh> | null = null;

async function authRequestRaw<T>(path: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
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
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      message: (data?.message as string) || `Error ${res.status}`,
    };
  }
  return { ok: true, data: data as T };
}

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const first = await authRequestRaw<T>(path, init);
  if (first.ok) return first.data;

  if (first.status === 401 && authStorage.getRefreshToken()) {
    try {
      if (!refreshInFlight) {
        refreshInFlight = authApi.refresh().finally(() => {
          refreshInFlight = null;
        });
      }

      const refreshPromise = refreshInFlight;
      if (!refreshPromise) throw new Error('No se pudo refrescar la sesion');
      const refreshed = await refreshPromise;
      authStorage.setSession(refreshed.user, refreshed.tokens);
      const retry = await authRequestRaw<T>(path, init);
      if (retry.ok) return retry.data;
      throw new Error(retry.message);
    } catch {
      authStorage.clear();
      throw new Error('Sesión vencida. Ingresá nuevamente.');
    }
  }

  throw new Error(first.message);
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
};
