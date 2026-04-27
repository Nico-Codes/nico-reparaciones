import type { CartLocalItem } from './types';

const CART_KEY = 'nico_next_cart';
export const CART_CHANGED_EVENT = 'nico-next-cart-changed';
export const CART_ADDED_EVENT = 'nico-next-cart-added';

export type CartAddedDetail = {
  productName: string;
};

function normalizeItem(input: Partial<CartLocalItem>) {
  return {
    productId: String(input.productId ?? '').trim(),
    variantId: String(input.variantId ?? '').trim() || null,
    quantity: Math.max(1, Math.min(999, Number(input.quantity) || 1)),
  };
}

function sameItemKey(left: Pick<CartLocalItem, 'productId' | 'variantId'>, right: Pick<CartLocalItem, 'productId' | 'variantId'>) {
  return left.productId === right.productId && (left.variantId ?? null) === (right.variantId ?? null);
}

function read(): CartLocalItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLocalItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeItem).filter((item) => item.productId);
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
    write(items.map(normalizeItem));
  },
  clear() {
    write([]);
  },
  add(productId: string, quantity = 1, options?: { productName?: string; variantId?: string | null }) {
    const items = read();
    const target = normalizeItem({ productId, quantity, variantId: options?.variantId ?? null });
    const idx = items.findIndex((item) => sameItemKey(item, target));
    if (idx >= 0) {
      items[idx] = { ...items[idx], quantity: Math.max(1, Math.min(999, items[idx].quantity + quantity)) };
    } else {
      items.push(target);
    }
    write(items);
    const productName = options?.productName?.trim();
    if (productName) dispatchCartAdded({ productName });
  },
  update(productId: string, quantity: number, variantId?: string | null) {
    const items = read()
      .map((item) =>
        sameItemKey(item, { productId, variantId: variantId ?? null })
          ? { ...item, quantity: Math.max(1, Math.min(999, quantity)) }
          : item,
      )
      .filter((item) => item.quantity > 0);
    write(items);
  },
  remove(productId: string, variantId?: string | null) {
    write(read().filter((item) => !sameItemKey(item, { productId, variantId: variantId ?? null })));
  },
  count() {
    return read().reduce((accumulator, item) => accumulator + item.quantity, 0);
  },
};
