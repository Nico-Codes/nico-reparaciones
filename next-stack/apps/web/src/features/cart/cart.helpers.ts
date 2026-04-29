import type { CartLocalItem, CartQuoteLine, CartQuoteResponse } from './types';

export type BadgeTone = 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'danger';

export function formatCartMoney(value: number) {
  return `$ ${value.toLocaleString('es-AR')}`;
}

export function isCartSpecialOrderLine(item: Pick<CartQuoteLine, 'fulfillmentMode'>) {
  return item.fulfillmentMode === 'SPECIAL_ORDER';
}

export function resolveCartStockTone(valid: boolean, stockAvailable: number, fulfillmentMode: CartQuoteLine['fulfillmentMode']): BadgeTone {
  if (fulfillmentMode === 'SPECIAL_ORDER') return valid ? 'accent' : 'warning';
  if (!valid || stockAvailable <= 0) return 'danger';
  if (stockAvailable <= 3) return 'warning';
  return 'success';
}

export function buildValidCartLines(items: CartQuoteLine[]) {
  return items.filter((item) => item.valid);
}

export function filterInventoryCartQuote(response: CartQuoteResponse) {
  const items = response.items.filter((item) => item.fulfillmentMode === 'INVENTORY');
  const validItems = buildValidCartLines(items);
  return {
    quote: {
      ...response,
      items,
      totals: {
        subtotal: validItems.reduce((total, item) => total + item.lineTotal, 0),
        itemsCount: validItems.reduce((total, item) => total + item.quantity, 0),
      },
    },
    removedSpecialOrderCount: response.items.length - items.length,
  };
}

export function buildQuotedCartItems(items: CartQuoteLine[]): CartLocalItem[] {
  return items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId ?? null,
    quantity: item.quantity,
  }));
}

export function sameCartItems(left: CartLocalItem[], right: CartLocalItem[]) {
  return (
    left.length === right.length &&
    left.every((item, index) => {
      const current = right[index];
      return (
        current &&
        current.productId === item.productId &&
        (current.variantId ?? null) === (item.variantId ?? null) &&
        current.quantity === item.quantity
      );
    })
  );
}

export function hasCartStockIssue(items: CartQuoteLine[]) {
  return items.some(
    (item) =>
      !item.valid ||
      (item.fulfillmentMode === 'INVENTORY' && item.quantity > Math.max(0, item.stockAvailable)),
  );
}

export function clampCartQuantity(
  rawValue: number,
  stockAvailable: number,
  fulfillmentMode: CartQuoteLine['fulfillmentMode'],
) {
  const maxQty = fulfillmentMode === 'SPECIAL_ORDER' ? 999 : stockAvailable > 0 ? stockAvailable : 1;
  return Math.min(maxQty, Math.max(1, Number(rawValue) || 1));
}

export function getCartLineAvailabilityLabel(item: CartQuoteLine) {
  if (item.fulfillmentMode === 'SPECIAL_ORDER') {
    return item.supplierAvailability === 'OUT_OF_STOCK' ? 'Proveedor sin stock' : 'Por encargue';
  }
  return item.stockAvailable > 0 ? `Stock ${item.stockAvailable}` : 'Sin stock';
}
