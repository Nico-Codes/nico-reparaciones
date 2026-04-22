import { describe, expect, it } from 'vitest';
import {
  assertValidOrderStatusTransition,
  buildWhatsappManualUrl,
  normalizeCheckoutPaymentMethod,
  normalizeOrderStatus,
  normalizePaymentMethod,
  normalizeWhatsappPhone,
  resolveQuickSalesRange,
} from './orders.helpers.js';

describe('orders.helpers', () => {
  it('normalizes valid order statuses and rejects invalid ones', () => {
    expect(normalizeOrderStatus(' confirmado ')).toBe('CONFIRMADO');
    expect(normalizeOrderStatus('otro')).toBeNull();
  });

  it('validates allowed status transitions', () => {
    expect(() => assertValidOrderStatusTransition('PENDIENTE', 'CONFIRMADO')).not.toThrow();
    expect(() => assertValidOrderStatusTransition('ENTREGADO', 'PREPARANDO')).toThrowError(/No se puede cambiar/);
  });

  it('normalizes checkout payment aliases', () => {
    expect(normalizeCheckoutPaymentMethod('cash')).toBe('efectivo');
    expect(normalizeCheckoutPaymentMethod('transfer')).toBe('transferencia');
    expect(normalizeCheckoutPaymentMethod('otro')).toBeNull();
    expect(normalizeCheckoutPaymentMethod('crypto')).toBeNull();
  });

  it('normalizes quick sale payment methods', () => {
    expect(normalizePaymentMethod('mercado_pago')).toBe('mercado_pago');
    expect(normalizePaymentMethod('otro')).toBeNull();
  });

  it('swaps quick sales range when dates arrive inverted', () => {
    const range = resolveQuickSalesRange('2026-03-10', '2026-03-05');
    expect(range.from).toBe('2026-03-05');
    expect(range.to).toBe('2026-03-10');
  });

  it('normalizes whatsapp numbers and builds manual url', () => {
    expect(normalizeWhatsappPhone('+54 9 341 555 1212')).toBe('5493415551212');
    expect(buildWhatsappManualUrl('+54 9 341 555 1212', 'Hola')).toContain('phone=5493415551212');
    expect(buildWhatsappManualUrl('123', 'Hola')).toBeNull();
  });
});
