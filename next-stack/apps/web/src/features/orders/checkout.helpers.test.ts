import { describe, expect, it } from 'vitest';
import {
  buildSpecialOrderCheckoutItems,
  DEFAULT_CHECKOUT_TRANSFER_DETAILS,
  resolveCheckoutPaymentMethods,
  resolveCheckoutTransferDetails,
  resolveSelectedPayment,
} from './checkout.helpers';

describe('checkout.helpers', () => {
  it('falls back to default payment methods and transfer details', () => {
    const methods = resolveCheckoutPaymentMethods();
    expect(methods).toHaveLength(2);
    expect(methods.map((item) => item.value)).toEqual(['efectivo', 'transferencia']);
    expect(resolveCheckoutTransferDetails()).toEqual(DEFAULT_CHECKOUT_TRANSFER_DETAILS);
  });

  it('resolves the selected payment against configured methods', () => {
    const payment = resolveSelectedPayment('transferencia', [
      {
        value: 'transferencia',
        title: 'Transferencia',
        subtitle: 'Datos bancarios antes de confirmar.',
        iconUrl: '/icons/payment-transfer.svg',
      },
    ]);

    expect(payment.value).toBe('transferencia');
    expect(payment.title).toBe('Transferencia');
  });

  it('ignores direct special-order params outside special-order mode', () => {
    const result = buildSpecialOrderCheckoutItems('?productId=product-1&quantity=2');

    expect(result.isSpecialOrderMode).toBe(false);
    expect(result.items).toEqual([]);
    expect(result.error).toBe('');
  });

  it('builds direct checkout items for special-order mode', () => {
    const result = buildSpecialOrderCheckoutItems(
      '?mode=special-order&productId=product-1&variantId=color-1&quantity=2000',
    );

    expect(result.isSpecialOrderMode).toBe(true);
    expect(result.error).toBe('');
    expect(result.items).toEqual([
      { productId: 'product-1', variantId: 'color-1', quantity: 999 },
    ]);
  });

  it('returns an actionable error when a direct special-order product is missing', () => {
    const result = buildSpecialOrderCheckoutItems('?mode=special-order&quantity=2');

    expect(result.isSpecialOrderMode).toBe(true);
    expect(result.items).toEqual([]);
    expect(result.error).toContain('Falta el producto');
  });
});
