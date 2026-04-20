import { describe, expect, it } from 'vitest';
import { buildAdminOrderDetailView, getOrderStatusAlertClassName } from './admin-order-detail.helpers';
import type { OrderItem } from './types';

const baseOrder: OrderItem = {
  id: 'ord_12345678',
  status: 'CONFIRMADO',
  total: 15000,
  paymentMethod: 'TRANSFERENCIA',
  transferProofUrl: null,
  transferProofUploadedAt: null,
  isQuickSale: false,
  user: {
    id: 'usr_1',
    name: 'Nico',
    email: 'nico@example.com',
  },
  createdAt: '2026-03-31T10:00:00.000Z',
  updatedAt: '2026-03-31T11:30:00.000Z',
  items: [
    {
      id: 'line_1',
      productId: 'prod_1',
      name: 'Bateria iPhone',
      unitPrice: 5000,
      quantity: 2,
      lineTotal: 10000,
    },
    {
      id: 'line_2',
      productId: 'prod_2',
      name: 'Modulo carga',
      unitPrice: 5000,
      quantity: 1,
      lineTotal: 5000,
    },
  ],
};

describe('admin-order-detail.helpers', () => {
  it('builds the detail summary for a web order', () => {
    const view = buildAdminOrderDetailView(baseOrder);

    expect(view.totalItems).toBe(3);
    expect(view.statusLabel).toBe('Confirmado');
    expect(view.customerLabel).toBe('Nico');
    expect(view.contactLabel).toBe('nico@example.com');
    expect(view.channelLabel).toBe('Compra web');
    expect(view.paymentLabel).toBe('Transferencia');
    expect(view.metrics[1]).toEqual({
      label: 'Ítems',
      value: '3',
      meta: '2 líneas en la operación.',
    });
    expect(view.facts[0]).toEqual({ label: 'Código', value: '#ord_1234' });
  });

  it('falls back to quick sale labels when there is no user', () => {
    const view = buildAdminOrderDetailView({
      ...baseOrder,
      isQuickSale: true,
      user: null,
      paymentMethod: null,
    });

    expect(view.customerLabel).toBe('Venta rápida');
    expect(view.contactLabel).toBe('Sin contacto registrado');
    expect(view.channelLabel).toBe('Venta rápida');
    expect(view.paymentLabel).toBe('A definir');
  });

  it('maps alert classes from order status', () => {
    expect(getOrderStatusAlertClassName('CANCELADO')).toBe('ui-alert--danger');
    expect(getOrderStatusAlertClassName('LISTO_RETIRO')).toBe('ui-alert--success');
    expect(getOrderStatusAlertClassName('CONFIRMADO')).toBe('ui-alert--info');
  });
});
