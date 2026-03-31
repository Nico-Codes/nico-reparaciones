import { describe, expect, it } from 'vitest';
import {
  buildQuotedCartItems,
  buildValidCartLines,
  clampCartQuantity,
  formatCartMoney,
  hasCartStockIssue,
  resolveCartStockTone,
  sameCartItems,
} from './cart.helpers';

describe('cart.helpers', () => {
  it('builds valid cart lines and normalized quoted items', () => {
    const lines = [
      {
        productId: 'p-1',
        quantity: 2,
        valid: true,
        reason: null,
        name: 'Modulo',
        unitPrice: 100,
        lineTotal: 200,
        stockAvailable: 4,
        active: true,
        category: null,
      },
      {
        productId: 'p-2',
        quantity: 1,
        valid: false,
        reason: 'sin stock',
        name: 'Bateria',
        unitPrice: 50,
        lineTotal: 50,
        stockAvailable: 0,
        active: true,
        category: null,
      },
    ];

    expect(buildValidCartLines(lines)).toHaveLength(1);
    expect(buildQuotedCartItems(lines)).toEqual([{ productId: 'p-1', quantity: 2 }]);
  });

  it('detects stock issues and compares local cart items by order', () => {
    expect(
      hasCartStockIssue([
        {
          productId: 'p-1',
          quantity: 3,
          valid: true,
          reason: null,
          name: 'Modulo',
          unitPrice: 100,
          lineTotal: 300,
          stockAvailable: 2,
          active: true,
          category: null,
        },
      ]),
    ).toBe(true);

    expect(
      sameCartItems(
        [{ productId: 'p-1', quantity: 2 }],
        [{ productId: 'p-1', quantity: 2 }],
      ),
    ).toBe(true);

    expect(
      sameCartItems(
        [{ productId: 'p-1', quantity: 2 }],
        [{ productId: 'p-1', quantity: 1 }],
      ),
    ).toBe(false);
  });

  it('formats money, resolves stock tones and clamps quantities safely', () => {
    expect(formatCartMoney(12345)).toBe('$ 12.345');
    expect(resolveCartStockTone(false, 5)).toBe('danger');
    expect(resolveCartStockTone(true, 2)).toBe('warning');
    expect(resolveCartStockTone(true, 8)).toBe('success');
    expect(clampCartQuantity(0, 5)).toBe(1);
    expect(clampCartQuantity(99, 3)).toBe(3);
    expect(clampCartQuantity(4, 0)).toBe(1);
  });
});
