import { authStorage } from '@/features/auth/storage';

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
};

