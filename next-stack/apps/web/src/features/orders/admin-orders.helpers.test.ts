import { describe, expect, it, vi } from 'vitest';
import type { OrderItem } from './types';
import { buildOrderStatusCounts, buildOrderTotals, buildWhatsappCounters, hasOrderFilters, timeAgo } from './admin-orders.helpers';

function makeOrder(input: Partial<OrderItem> & Pick<OrderItem, 'id' | 'status' | 'total' | 'createdAt' | 'updatedAt' | 'items'>): OrderItem {
  return {
    paymentMethod: null,
    isQuickSale: false,
    ...input,
  };
}

describe('admin-orders helpers', () => {
  it('builds totals and status counts from the visible list', () => {
    const items = [
      makeOrder({ id: '1', status: 'PENDIENTE', total: 100, createdAt: '2026-03-31T10:00:00.000Z', updatedAt: '2026-03-31T10:00:00.000Z', items: [] }),
      makeOrder({ id: '2', status: 'LISTO_RETIRO', total: 250, createdAt: '2026-03-31T11:00:00.000Z', updatedAt: '2026-03-31T11:00:00.000Z', items: [] }),
    ];

    expect(buildOrderTotals(items)).toEqual({ count: 2, total: 350 });
    expect(buildOrderStatusCounts(items)).toMatchObject({
      all: 2,
      PENDIENTE: 1,
      LISTO_RETIRO: 1,
    });
  });

  it('derives whatsapp counters from visible orders', () => {
    const items = [
      makeOrder({ id: '1', status: 'PENDIENTE', total: 100, createdAt: '2026-03-31T10:00:00.000Z', updatedAt: '2026-03-31T10:00:00.000Z', items: [], user: null }),
      makeOrder({
        id: '2',
        status: 'CONFIRMADO',
        total: 250,
        createdAt: '2026-03-31T11:00:00.000Z',
        updatedAt: '2026-03-31T11:00:00.000Z',
        items: [],
        user: { id: 'u1', name: 'Nico', email: 'nico@example.com' },
      }),
    ];

    expect(buildWhatsappCounters(items)).toEqual({
      all: 2,
      pending: 1,
      inFlow: 1,
      withoutEmail: 1,
    });
  });

  it('detects active filters and formats time ago in days and weeks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-31T12:00:00.000Z'));

    expect(hasOrderFilters('', '')).toBe(false);
    expect(hasOrderFilters('abc', '')).toBe(true);
    expect(timeAgo('2026-03-31T11:30:00.000Z')).toBe('hace 30 min');
    expect(timeAgo('2026-03-30T12:00:00.000Z')).toBe('hace 1 dia');
    expect(timeAgo('2026-03-17T12:00:00.000Z')).toBe('hace 2 semanas');

    vi.useRealTimers();
  });
});
