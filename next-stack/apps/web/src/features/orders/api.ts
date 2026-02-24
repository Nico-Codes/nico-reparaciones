import { authStorage } from '@/features/auth/storage';
import type { CartLocalItem } from '@/features/cart/types';
import type { OrderItem } from './types';

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
  if (!res.ok) {
    throw new Error((data?.message as string) || `Error ${res.status}`);
  }
  return data as T;
}

export const ordersApi = {
  checkout(input: { items: CartLocalItem[]; paymentMethod: string }) {
    return authRequest<OrderItem>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  myOrders() {
    return authRequest<{ items: OrderItem[] }>('/orders/my', { method: 'GET' });
  },
  myOrder(id: string) {
    return authRequest<{ item: OrderItem }>('/orders/my/' + encodeURIComponent(id), { method: 'GET' });
  },
  adminOrders(params?: { status?: string; q?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.q) qs.set('q', params.q);
    return authRequest<{ items: OrderItem[] }>('/orders/admin' + (qs.size ? `?${qs.toString()}` : ''), { method: 'GET' });
  },
  adminOrder(id: string) {
    return authRequest<{ item: OrderItem }>('/orders/admin/' + encodeURIComponent(id), { method: 'GET' });
  },
  adminUpdateStatus(id: string, status: string) {
    return authRequest<{ item: OrderItem }>(`/orders/admin/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
