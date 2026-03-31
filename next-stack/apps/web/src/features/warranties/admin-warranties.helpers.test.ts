import { describe, expect, it } from 'vitest';
import {
  buildAdminWarrantiesQuery,
  buildAdminWarrantiesStatCards,
  buildWarrantyRelatedLine,
  createDefaultAdminWarrantiesFilters,
  getTopWarrantySupplier,
  getWarrantyStatusBadgeClass,
} from './admin-warranties.helpers';

describe('admin-warranties.helpers', () => {
  it('builds the warranties query trimming empty filters', () => {
    expect(
      buildAdminWarrantiesQuery({
        q: '  pantalla rota  ',
        sourceType: 'repair',
        status: '',
        from: '',
        to: '2026-03-31',
      }),
    ).toEqual({
      q: 'pantalla rota',
      sourceType: 'repair',
      status: undefined,
      from: undefined,
      to: '2026-03-31',
    });
  });

  it('returns the first supplier as top loss entry', () => {
    expect(getTopWarrantySupplier([])).toBeNull();
    expect(
      getTopWarrantySupplier([
        { supplierId: 'sup-1', name: 'Proveedor Uno', incidentsCount: 3, totalLoss: 12000 },
        { supplierId: 'sup-2', name: 'Proveedor Dos', incidentsCount: 1, totalLoss: 4000 },
      ]),
    ).toEqual({ supplierId: 'sup-1', name: 'Proveedor Uno', incidentsCount: 3, totalLoss: 12000 });
  });

  it('builds related line and status styles for repair and product incidents', () => {
    expect(
      buildWarrantyRelatedLine({
        id: 'w-1',
        sourceType: 'repair',
        source: 'Reparacion',
        status: 'open',
        statusLabel: 'Abierto',
        title: 'Cambio',
        reason: '',
        repairId: 'r-1',
        repairCode: 'R-123',
        customerName: 'Nico',
        productId: null,
        productName: '',
        providerId: null,
        provider: '',
        costSource: 'repair',
        quantity: 1,
        unitCost: 100,
        cost: 100,
        recovered: 0,
        loss: 100,
        notes: '',
        happenedAt: '',
        date: '2026-03-31',
        time: '10:00',
      }),
    ).toBe('Reparacion: R-123 - Nico');

    expect(
      buildWarrantyRelatedLine({
        id: 'w-2',
        sourceType: 'product',
        source: 'Producto',
        status: 'closed',
        statusLabel: 'Cerrado',
        title: 'Cambio',
        reason: '',
        repairId: null,
        repairCode: null,
        customerName: '',
        productId: 'p-1',
        productName: 'Modulo OLED',
        providerId: null,
        provider: '',
        costSource: 'product',
        quantity: 1,
        unitCost: 100,
        cost: 100,
        recovered: 0,
        loss: 100,
        notes: '',
        happenedAt: '',
        date: '2026-03-31',
        time: '10:00',
      }),
    ).toBe('Producto: Modulo OLED');

    expect(getWarrantyStatusBadgeClass('open')).toContain('border-amber-300');
    expect(getWarrantyStatusBadgeClass('closed')).toContain('border-zinc-200');
  });

  it('builds stat cards and exposes default filters', () => {
    expect(createDefaultAdminWarrantiesFilters()).toEqual({
      q: '',
      sourceType: '',
      status: '',
      from: '',
      to: '',
    });

    expect(
      buildAdminWarrantiesStatCards({
        totalCount: 12,
        openCount: 4,
        closedCount: 8,
        totalLoss: 15300,
      }),
    ).toEqual([
      { title: 'TOTAL INCIDENTES', value: '12' },
      { title: 'ABIERTOS', value: '4', valueClass: 'text-amber-600' },
      { title: 'CERRADOS', value: '8' },
      { title: 'PERDIDA ACUMULADA', value: '$ 15.300', valueClass: 'text-rose-700' },
    ]);
  });
});
