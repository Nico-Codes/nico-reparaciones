import { describe, expect, it } from 'vitest';
import {
  buildOrderDetailLinesMeta,
  buildOrderDetailSummaryFacts,
  buildOrderTransferWhatsappUrl,
  orderUsesTransferPayment,
  resolveOrderDetailAlertTone,
} from './order-detail.helpers';

describe('order-detail.helpers', () => {
  const order = {
    id: 'ord_1',
    status: 'LISTO_RETIRO',
    total: 30,
    paymentMethod: 'cash',
    transferProofUrl: null,
    transferProofUploadedAt: null,
    isQuickSale: false,
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T11:00:00.000Z',
    items: [
      { id: 'line_1', productId: 'prod_1', name: 'Modulo', quantity: 2, unitPrice: 10, lineTotal: 20 },
      { id: 'line_2', productId: 'prod_2', name: 'Bateria', quantity: 1, unitPrice: 10, lineTotal: 10 },
    ],
  };

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

  it('arma link de whatsapp para comprobante de transferencia', () => {
    const url = buildOrderTransferWhatsappUrl(
      { ...order, paymentMethod: 'transferencia' } as never,
      {
        title: '',
        description: '',
        note: '',
        available: true,
        supportWhatsappPhone: '+54 9 341 555 1212',
        fields: [],
      },
    );
    expect(url).toContain('phone=5493415551212');
    expect(url).toContain('Pedido%3A');
  });
});
