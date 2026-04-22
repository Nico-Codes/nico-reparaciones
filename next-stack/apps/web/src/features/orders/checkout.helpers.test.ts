import { describe, expect, it } from 'vitest';
import {
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
});
