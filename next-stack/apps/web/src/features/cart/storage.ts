import type { CartLocalItem } from './types';

const CART_KEY = 'nico_next_cart';
export const CART_CHANGED_EVENT = 'nico-next-cart-changed';
export const CART_ADDED_EVENT = 'nico-next-cart-added';

export type CartAddedDetail = {
  productName: string;
};

function read(): CartLocalItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLocalItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((i) => ({
        productId: String(i.productId ?? '').trim(),
        quantity: Math.max(1, Math.min(999, Number(i.quantity) || 1)),
      }))
      .filter((i) => i.productId);
  } catch {
    return [];
  }
}

function write(items: CartLocalItem[]) {
  const next = JSON.stringify(items);
  const prev = localStorage.getItem(CART_KEY);
  if (prev === next) return;
  localStorage.setItem(CART_KEY, next);
  window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT));
}

function dispatchCartAdded(detail: CartAddedDetail) {
  window.dispatchEvent(new CustomEvent<CartAddedDetail>(CART_ADDED_EVENT, { detail }));
}

export const cartStorage = {
  getItems: read,
  setItems(items: CartLocalItem[]) {
    write(items);
  },
  clear() {
    write([]);
  },
  add(productId: string, quantity = 1, options?: { productName?: string }) {
    const items = read();
    const idx = items.findIndex((i) => i.productId === productId);
    if (idx >= 0) {
      items[idx] = { ...items[idx], quantity: Math.max(1, Math.min(999, items[idx].quantity + quantity)) };
    } else {
      items.push({ productId, quantity: Math.max(1, Math.min(999, quantity)) });
    }
    write(items);
    const productName = options?.productName?.trim();
    if (productName) dispatchCartAdded({ productName });
  },
  update(productId: string, quantity: number) {
    const items = read()
      .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(999, quantity)) } : i))
      .filter((i) => i.quantity > 0);
    write(items);
  },
  remove(productId: string) {
    write(read().filter((i) => i.productId !== productId));
  },
  count() {
    return read().reduce((acc, i) => acc + i.quantity, 0);
  },
};
