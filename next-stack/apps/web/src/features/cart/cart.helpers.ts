import type { CartLocalItem, CartQuoteLine } from './types';

export type BadgeTone = 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'danger';

export function formatCartMoney(value: number) {
  return `$ ${value.toLocaleString('es-AR')}`;
}

export function resolveCartStockTone(valid: boolean, stockAvailable: number): BadgeTone {
  if (!valid || stockAvailable <= 0) return 'danger';
  if (stockAvailable <= 3) return 'warning';
  return 'success';
}

export function buildValidCartLines(items: CartQuoteLine[]) {
  return items.filter((item) => item.valid);
}

export function buildQuotedCartItems(items: CartQuoteLine[]): CartLocalItem[] {
  return buildValidCartLines(items).map((item) => ({ productId: item.productId, quantity: item.quantity }));
}

export function sameCartItems(left: CartLocalItem[], right: CartLocalItem[]) {
  return (
    left.length === right.length &&
    left.every((item, index) => {
      const current = right[index];
      return current && current.productId === item.productId && current.quantity === item.quantity;
    })
  );
}

export function hasCartStockIssue(items: CartQuoteLine[]) {
  return items.some((item) => !item.valid || item.quantity > Math.max(0, item.stockAvailable));
}

export function clampCartQuantity(rawValue: number, stockAvailable: number) {
  const maxQty = stockAvailable > 0 ? stockAvailable : 1;
  return Math.min(maxQty, Math.max(1, Number(rawValue) || 1));
}
