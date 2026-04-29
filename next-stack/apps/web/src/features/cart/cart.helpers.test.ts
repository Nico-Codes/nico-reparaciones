import { describe, expect, it } from 'vitest';
import type { CartQuoteLine } from './types';
import {
  buildQuotedCartItems,
  buildValidCartLines,
  clampCartQuantity,
  filterInventoryCartQuote,
  formatCartMoney,
  hasCartStockIssue,
  resolveCartStockTone,
  sameCartItems,
} from './cart.helpers';

function makeLine(
  input: Partial<CartQuoteLine> & Pick<CartQuoteLine, 'productId' | 'quantity' | 'valid' | 'name' | 'unitPrice' | 'lineTotal' | 'stockAvailable'>,
): CartQuoteLine {
  return {
    variantId: input.variantId ?? null,
    requestedQuantity: input.requestedQuantity ?? input.quantity,
    reason: input.reason ?? null,
    slug: input.slug,
    selectedColorLabel: input.selectedColorLabel ?? null,
    fulfillmentMode: input.fulfillmentMode ?? 'INVENTORY',
    supplierAvailability: input.supplierAvailability ?? 'IN_STOCK',
    active: input.active ?? true,
    category: input.category ?? null,
    requiresColorSelection: input.requiresColorSelection ?? false,
    colorOptions: input.colorOptions ?? [],
    ...input,
  };
}

describe('cart.helpers', () => {
  it('builds valid cart lines and normalized quoted items', () => {
    const lines = [
      makeLine({
        productId: 'p-1',
        quantity: 2,
        valid: true,
        name: 'Modulo',
        unitPrice: 100,
        lineTotal: 200,
        stockAvailable: 4,
      }),
      makeLine({
        productId: 'p-2',
        quantity: 1,
        valid: false,
        reason: 'sin stock',
        name: 'Bateria',
        unitPrice: 50,
        lineTotal: 50,
        stockAvailable: 0,
      }),
    ];

    expect(buildValidCartLines(lines)).toHaveLength(1);
    expect(buildQuotedCartItems(lines)).toEqual([
      { productId: 'p-1', variantId: null, quantity: 2 },
      { productId: 'p-2', variantId: null, quantity: 1 },
    ]);
  });

  it('detects stock issues and compares local cart items by order', () => {
    expect(
      hasCartStockIssue([
        makeLine({
          productId: 'p-1',
          quantity: 3,
          valid: true,
          name: 'Modulo',
          unitPrice: 100,
          lineTotal: 300,
          stockAvailable: 2,
        }),
      ]),
    ).toBe(true);

    expect(
      hasCartStockIssue([
        makeLine({
          productId: 'p-3',
          quantity: 5,
          valid: true,
          name: 'iPhone 13',
          unitPrice: 100,
          lineTotal: 500,
          stockAvailable: 0,
          fulfillmentMode: 'SPECIAL_ORDER',
        }),
      ]),
    ).toBe(false);

    expect(
      sameCartItems(
        [{ productId: 'p-1', quantity: 2 }],
        [{ productId: 'p-1', variantId: null, quantity: 2 }],
      ),
    ).toBe(true);

    expect(
      sameCartItems(
        [{ productId: 'p-1', variantId: null, quantity: 2 }],
        [{ productId: 'p-1', variantId: null, quantity: 1 }],
      ),
    ).toBe(false);
  });

  it('formats money, resolves stock tones and clamps quantities safely', () => {
    expect(formatCartMoney(12345)).toBe('$ 12.345');
    expect(resolveCartStockTone(false, 5, 'INVENTORY')).toBe('danger');
    expect(resolveCartStockTone(true, 2, 'INVENTORY')).toBe('warning');
    expect(resolveCartStockTone(true, 8, 'INVENTORY')).toBe('success');
    expect(resolveCartStockTone(true, 0, 'SPECIAL_ORDER')).toBe('accent');
    expect(resolveCartStockTone(false, 0, 'SPECIAL_ORDER')).toBe('warning');
    expect(clampCartQuantity(0, 5, 'INVENTORY')).toBe(1);
    expect(clampCartQuantity(99, 3, 'INVENTORY')).toBe(3);
    expect(clampCartQuantity(4, 0, 'INVENTORY')).toBe(1);
    expect(clampCartQuantity(2000, 0, 'SPECIAL_ORDER')).toBe(999);
  });

  it('filters special order lines out of cart quotes', () => {
    const inventoryLine = makeLine({
      productId: 'p-1',
      quantity: 2,
      valid: true,
      name: 'Cable',
      unitPrice: 100,
      lineTotal: 200,
      stockAvailable: 4,
    });
    const specialOrderLine = makeLine({
      productId: 'p-2',
      quantity: 1,
      valid: true,
      name: 'iPhone por encargue',
      unitPrice: 1000,
      lineTotal: 1000,
      stockAvailable: 0,
      fulfillmentMode: 'SPECIAL_ORDER',
    });

    const result = filterInventoryCartQuote({
      items: [inventoryLine, specialOrderLine],
      totals: { subtotal: 1200, itemsCount: 3 },
    });

    expect(result.removedSpecialOrderCount).toBe(1);
    expect(result.quote.items).toEqual([inventoryLine]);
    expect(result.quote.totals).toEqual({ subtotal: 200, itemsCount: 2 });
  });
});
