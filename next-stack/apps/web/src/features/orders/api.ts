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
};
