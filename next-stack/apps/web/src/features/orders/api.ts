import { authJsonRequest } from '@/features/auth/http';
import type { CartLocalItem } from '@/features/cart/types';
import type { OrderItem } from './types';

export const ordersApi = {
  checkout(input: { items: CartLocalItem[]; paymentMethod: string }) {
    return authJsonRequest<OrderItem>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  myOrders() {
    return authJsonRequest<{ items: OrderItem[] }>('/orders/my', { method: 'GET' });
  },
  myOrder(id: string) {
    return authJsonRequest<{ item: OrderItem }>('/orders/my/' + encodeURIComponent(id), { method: 'GET' });
  },
  adminOrders(params?: { status?: string; q?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.q) qs.set('q', params.q);
    return authJsonRequest<{ items: OrderItem[] }>('/orders/admin' + (qs.size ? `?${qs.toString()}` : ''), { method: 'GET' });
  },
  adminOrder(id: string) {
    return authJsonRequest<{ item: OrderItem }>('/orders/admin/' + encodeURIComponent(id), { method: 'GET' });
  },
  adminUpdateStatus(id: string, status: string) {
    return authJsonRequest<{ item: OrderItem }>(`/orders/admin/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
