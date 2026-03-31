import { describe, expect, it } from 'vitest';
import { buildDashboardSummary, buildDashboardWorkQueue, normalizeDashboardRepairStatus } from './admin-dashboard.helpers';
import type { AdminDashboardResponse } from './api';

function makeDashboardData(): AdminDashboardResponse {
  return {
    metrics: {
      products: { total: 20, active: 18, lowStock: 3, outOfStock: 1 },
      repairs: { open: 7, readyPickup: 2, createdToday: 1 },
      orders: { pendingFlow: 4, createdToday: 2, revenueMonth: 250000 },
    },
    alerts: [
      { id: 'pending-flow-orders', severity: 'medium', title: 'Pedidos pendientes', value: 6 },
      { id: 'stock-low-products', severity: 'high', title: 'Stock bajo', value: 3 },
    ],
    recent: {
      orders: [
        {
          id: 'order-1',
          status: 'DELIVERED',
          total: 20000,
          createdAt: '2026-03-31T12:00:00.000Z',
          user: { id: 'user-1', name: 'Ana', email: 'ana@test.local' },
          itemsPreview: [],
        },
        {
          id: 'order-2',
          status: 'PENDING',
          total: 5000,
          createdAt: '2026-03-31T13:00:00.000Z',
          user: null,
          itemsPreview: [],
        },
      ],
      repairs: [
        {
          id: 'repair-1',
          status: 'WAITING_APPROVAL',
          customerName: 'Luis',
          deviceBrand: 'Samsung',
          deviceModel: 'A10',
          issueLabel: 'Modulo',
          quotedPrice: 14000,
          finalPrice: null,
          createdAt: '2026-03-31T11:00:00.000Z',
        },
        {
          id: 'repair-2',
          status: 'IN_REPAIR',
          customerName: 'Marta',
          deviceBrand: 'Motorola',
          deviceModel: 'G9',
          issueLabel: 'Bateria',
          quotedPrice: 9000,
          finalPrice: null,
          createdAt: '2026-03-31T10:00:00.000Z',
        },
        {
          id: 'repair-3',
          status: 'DELIVERED',
          customerName: 'Pepe',
          deviceBrand: 'Xiaomi',
          deviceModel: 'Note',
          issueLabel: 'Pin',
          quotedPrice: 7000,
          finalPrice: 8000,
          createdAt: '2026-03-30T19:00:00.000Z',
        },
      ],
    },
    generatedAt: '2026-03-31T15:00:00.000Z',
  };
}

describe('admin-dashboard.helpers', () => {
  it('builds dashboard summary from recent items and alerts', () => {
    const summary = buildDashboardSummary(makeDashboardData());

    expect(summary.deliveredRevenue).toBe(20000);
    expect(summary.ticketAverage).toBe(20000);
    expect(summary.avgRepairValue).toBe(8000);
    expect(summary.pendingApprovals).toBe(1);
    expect(summary.repairDiagnosis).toBe(0);
    expect(summary.pendingFlowOrders).toBe(4);
    expect(summary.whatsappPending).toBe(6);
    expect(summary.orderStatusCounts.PENDIENTE).toBe(1);
    expect(summary.repairStatusCounts.REPAIRING).toBe(1);
  });

  it('sorts work queue by highest operational value first', () => {
    const workQueue = buildDashboardWorkQueue({
      deliveredRevenue: 0,
      ticketAverage: 0,
      avgRepairValue: 0,
      lowStockProducts: 8,
      pendingApprovals: 2,
      repairDiagnosis: 5,
      repairReadyPickup: 1,
      pendingFlowOrders: 4,
      whatsappPending: 0,
      orderStatusCounts: {
        PENDIENTE: 0,
        CONFIRMADO: 0,
        PREPARANDO: 0,
        LISTO_RETIRO: 0,
        ENTREGADO: 0,
        CANCELADO: 0,
      },
      repairStatusCounts: {
        RECEIVED: 0,
        DIAGNOSING: 0,
        WAITING_APPROVAL: 0,
        REPAIRING: 0,
        READY_PICKUP: 0,
        DELIVERED: 0,
        CANCELLED: 0,
      },
    });

    expect(workQueue[0]).toMatchObject({ id: 'stock-low', value: 8 });
    expect(workQueue[1]).toMatchObject({ id: 'repair-diagnosis', value: 5 });
  });

  it('normalizes IN_REPAIR to REPAIRING for dashboard counters', () => {
    expect(normalizeDashboardRepairStatus('IN_REPAIR')).toBe('REPAIRING');
    expect(normalizeDashboardRepairStatus('READY_PICKUP')).toBe('READY_PICKUP');
  });
});
