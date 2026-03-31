import { describe, expect, it } from 'vitest';
import {
  buildCheckoutEmptyState,
  buildCheckoutItems,
  buildValidCheckoutLines,
  emailVerificationTone,
  formatCheckoutMoney,
  hasInvalidCheckoutItems,
  resolveSelectedPayment,
  sameCartItems,
} from './checkout.helpers';

describe('checkout.helpers', () => {
  it('builds valid checkout lines and payload items', () => {
    const lines = buildValidCheckoutLines([
      { productId: 'p-1', quantity: 2, valid: true, reason: null, name: 'Modulo', unitPrice: 100, lineTotal: 200, stockAvailable: 3, active: true, category: null },
      { productId: 'p-2', quantity: 1, valid: false, reason: 'sin stock', name: 'Bateria', unitPrice: 50, lineTotal: 50, stockAvailable: 0, active: true, category: null },
    ]);

    expect(lines).toHaveLength(1);
    expect(buildCheckoutItems(lines)).toEqual([{ productId: 'p-1', quantity: 2 }]);
    expect(hasInvalidCheckoutItems([...lines, {
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
    }])).toBe(true);
  });

  it('compares local cart items by order and quantity', () => {
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

  it('builds empty state, money formatting and payment resolution', () => {
    expect(buildCheckoutEmptyState(true).title).toBe('Hay productos para revisar');
    expect(buildCheckoutEmptyState(false).title).toBe('Tu carrito está vacío');
    expect(formatCheckoutMoney(12345)).toBe('$ 12.345');
    expect(resolveSelectedPayment('transferencia').title).toBe('Transferencia');
    expect(resolveSelectedPayment('desconocido').value).toBe('efectivo');
  });

  it('maps email verification to badge tone', () => {
    expect(emailVerificationTone(true)).toBe('success');
    expect(emailVerificationTone(false)).toBe('warning');
    expect(emailVerificationTone(undefined)).toBe('warning');
  });
});
