import { describe, expect, it } from 'vitest';
import {
  buildOrderDetailLinesMeta,
  buildOrderDetailSummaryFacts,
  orderUsesTransferPayment,
  resolveOrderDetailAlertTone,
} from './order-detail.helpers';

describe('order-detail.helpers', () => {
  const order = {
    id: 'ord_1',
    status: 'LISTO_RETIRO',
    total: 30,
    paymentMethod: 'cash',
    isQuickSale: false,
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T11:00:00.000Z',
    items: [
      { quantity: 2, unitPrice: 10, lineTotal: 20 },
      { quantity: 1, unitPrice: 10, lineTotal: 10 },
    ],
  } as never;

  it('calcula items y lineas', () => {
    expect(buildOrderDetailLinesMeta(order)).toMatchObject({ lines: 2, totalItems: 3 });
  });

  it('resuelve tono de alerta por estado', () => {
    expect(resolveOrderDetailAlertTone('LISTO_RETIRO')).toBe('success');
    expect(resolveOrderDetailAlertTone('CANCELADO')).toBe('danger');
  });

  it('arma el resumen del sidebar', () => {
    expect(buildOrderDetailSummaryFacts(order)).toHaveLength(6);
  });

  it('detecta pago por transferencia', () => {
    expect(orderUsesTransferPayment('transferencia')).toBe(true);
    expect(orderUsesTransferPayment('efectivo')).toBe(false);
  });
});
