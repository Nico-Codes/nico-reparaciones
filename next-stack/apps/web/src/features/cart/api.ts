import type { CartLocalItem, CartQuoteResponse } from './types';
import { publicJsonRequest } from '@/features/auth/http';

export async function quoteCart(items: CartLocalItem[]): Promise<CartQuoteResponse> {
  return publicJsonRequest<CartQuoteResponse>('/cart/quote', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}
