import type { CartLocalItem, CartQuoteResponse } from './types';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

export async function quoteCart(items: CartLocalItem[]): Promise<CartQuoteResponse> {
  const res = await fetch(`${API_URL}/api/cart/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  const data = await res.json().catch(() => ({ items: [], totals: { subtotal: 0, itemsCount: 0 } }));
  if (!res.ok) throw new Error((data?.message as string) || `Error ${res.status}`);
  return data as CartQuoteResponse;
}
