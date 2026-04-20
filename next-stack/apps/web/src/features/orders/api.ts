import { authFetch, authJsonRequest } from '@/features/auth/http';
import type { CartLocalItem } from '@/features/cart/types';
import type { CheckoutConfig, OrderItem, QuickSaleHistoryItem } from './types';

async function authMultipartRequest<T>(path: string, form: FormData): Promise<T> {
  const res = await authFetch(path, {
    method: 'POST',
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.message as string) || `Error ${res.status}`);
  return data as T;
}

export const ordersApi = {
  checkoutConfig() {
    return authJsonRequest<CheckoutConfig>('/orders/checkout-config', { method: 'GET' });
  },
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
  uploadTransferProof(id: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    return authMultipartRequest<{ item: OrderItem }>(`/orders/my/${encodeURIComponent(id)}/transfer-proof`, form);
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
  adminQuickSaleConfirm(input: {
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod: string;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  }) {
    return authJsonRequest<{ item: OrderItem }>('/orders/admin/quick-sales/confirm', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  adminQuickSales(params?: { from?: string; to?: string; payment?: string; adminId?: string }) {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    if (params?.payment) qs.set('payment', params.payment);
    if (params?.adminId) qs.set('adminId', params.adminId);
    return authJsonRequest<{
      from: string;
      to: string;
      payment: string;
      adminId: string | null;
      paymentMethods: Array<{ key: string; label: string }>;
      summary: { salesCount: number; salesTotal: number };
      admins: Array<{ id: string; name: string; email: string }>;
      items: QuickSaleHistoryItem[];
    }>('/orders/admin/quick-sales' + (qs.size ? `?${qs.toString()}` : ''), { method: 'GET' });
  },
};
