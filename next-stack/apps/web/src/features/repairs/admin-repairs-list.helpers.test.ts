import { describe, expect, it } from 'vitest';
import {
  buildAdminRepairStats,
  filterAdminRepairItems,
  getRepairCommercialStatusLabel,
  getRepairDeviceLabel,
  getRepairIssueLabel,
  getRepairOriginLabel,
  getRepairReferencePrice,
  hasAdminRepairFilters,
} from './admin-repairs-list.helpers';
import type { RepairItem } from './types';

function buildRepair(overrides: Partial<RepairItem> = {}): RepairItem {
  return {
    id: 'repair-1',
    userId: null,
    customerName: 'Juan Perez',
    customerPhone: '1122334455',
    deviceBrand: 'Samsung',
    deviceModel: 'A10',
    issueLabel: 'Pantalla rota',
    status: 'RECEIVED',
    quotedPrice: null,
    finalPrice: null,
    notes: null,
    createdAt: '2026-03-31T10:00:00.000Z',
    updatedAt: '2026-03-31T11:00:00.000Z',
    ...overrides,
  };
}

describe('admin-repairs-list.helpers', () => {
  it('buildAdminRepairStats counts operational statuses', () => {
    const items = [
      buildRepair({ id: 'r-1', status: 'WAITING_APPROVAL' }),
      buildRepair({ id: 'r-2', status: 'READY_PICKUP' }),
      buildRepair({ id: 'r-3', status: 'DELIVERED' }),
      buildRepair({ id: 'r-4', status: 'DELIVERED' }),
    ];

    expect(buildAdminRepairStats(items)).toEqual({
      total: 4,
      waitingApproval: 1,
      readyPickup: 1,
      completed: 2,
    });
  });

  it('filterAdminRepairItems applies status and text filters', () => {
    const items = [
      buildRepair({ id: 'repair-a', status: 'WAITING_APPROVAL', customerName: 'Ana Lopez' }),
      buildRepair({ id: 'repair-b', status: 'READY_PICKUP', customerName: 'Bruno Diaz', deviceModel: 'Moto G54' }),
      buildRepair({ id: 'repair-c', status: 'DELIVERED', customerName: 'Carla Ruiz' }),
    ];

    expect(filterAdminRepairItems(items, 'moto', '').map((item) => item.id)).toEqual(['repair-b']);
    expect(filterAdminRepairItems(items, '', 'DELIVERED').map((item) => item.id)).toEqual(['repair-c']);
  });

  it('builds derived labels for device, pricing and origin', () => {
    const webRepair = buildRepair({
      userId: 'user-1',
      quotedPrice: 12000,
      finalPrice: 15000,
      issueLabel: null,
      deviceBrand: null,
      deviceModel: null,
    });

    expect(getRepairReferencePrice(webRepair)).toBe(15000);
    expect(getRepairCommercialStatusLabel(webRepair)).toBe('Presupuesto final confirmado');
    expect(getRepairIssueLabel(webRepair)).toBe('Sin diagnostico registrado');
    expect(getRepairDeviceLabel(webRepair)).toBe('Equipo sin identificar');
    expect(getRepairOriginLabel(webRepair)).toBe('Cliente web');
    expect(hasAdminRepairFilters('', '')).toBe(false);
    expect(hasAdminRepairFilters('ana', '')).toBe(true);
  });
});
