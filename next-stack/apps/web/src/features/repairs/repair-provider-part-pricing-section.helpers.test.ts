import { describe, expect, it } from 'vitest';
import {
  availabilityLabel,
  buildProviderPricingStatusBadge,
  buildProviderFilterOptions,
  buildVisibleProviderSearchState,
  parseOptionalMoney,
  parsePositiveInteger,
  partKey,
  resolveSelectedProviderFilter,
  snapshotStatusLabel,
} from './repair-provider-part-pricing-section.helpers';

describe('repair-provider-part-pricing-section helpers', () => {
  it('parses integer quantities with validation', () => {
    expect(parsePositiveInteger('').value).toBe(1);
    expect(parsePositiveInteger('3')).toEqual({ value: 3, error: '' });
    expect(parsePositiveInteger('0').error).toMatch(/cantidad válida/i);
  });

  it('parses optional money values with locale tolerance', () => {
    expect(parseOptionalMoney('', 'extra')).toEqual({ value: 0, error: '' });
    expect(parseOptionalMoney('12,5', 'envío')).toEqual({ value: 12.5, error: '' });
    expect(parseOptionalMoney('-1', 'extra').error).toMatch(/válido/i);
  });

  it('builds stable keys and labels', () => {
    expect(
      partKey({
        externalPartId: 'ext-1',
        sku: 'sku-1',
        url: 'https://supplier/item',
        name: ' Modulo A30 ',
        supplier: { id: 'sup-1' } as any,
      }),
    ).toContain('sup-1');
    expect(availabilityLabel('in_stock')).toBe('Disponible');
    expect(snapshotStatusLabel({ id: 'snap-1', status: 'APPLIED' } as any, 'snap-1')).toBe('Activo');
  });

  it('adds the historical provider option when missing from active providers', () => {
    const options = buildProviderFilterOptions(
      [{ id: 'sup-1', name: 'Proveedor 1' } as any],
      { supplierId: 'sup-old', supplierNameSnapshot: 'Proveedor viejo' } as any,
    );

    expect(options.map((item) => item.value)).toEqual(['', 'sup-old', 'sup-1']);
    expect(options[1]?.label).toMatch(/histórico/i);
  });
  it('resolves provider fallback and hides smoke suppliers in derived search state', () => {
    expect(
      resolveSelectedProviderFilter([{ id: 'sup-1', name: 'Proveedor 1', endpoint: 'https://one.test' } as any], 'sup-old', {
        supplierId: 'sup-old',
        supplierNameSnapshot: 'Proveedor historico',
        supplierEndpointSnapshot: 'https://old.test',
      } as any),
    ).toMatchObject({ id: 'sup-old', name: 'Proveedor historico' });

    const visible = buildVisibleProviderSearchState(
      [
        { name: 'Modulo A30', supplier: { name: 'Proveedor 1' } } as any,
        { name: 'Smoke item', supplier: { name: 'Smoke Supplier 1' } } as any,
      ],
    );

    expect(visible.visiblePartResults).toHaveLength(1);
  });

  it('builds status badge priority consistently', () => {
    expect(
      buildProviderPricingStatusBadge({
        pendingSnapshotIsCurrent: false,
        previewLoading: false,
        searchLoading: false,
        providersLoading: false,
        providersError: '',
        searchError: '',
        activePreviewError: '',
        previewNeedsRefresh: true,
        activePreviewResult: null,
        activeSnapshot: null,
      }),
    ).toEqual({ label: 'Recalcular', tone: 'warning' });

    expect(
      buildProviderPricingStatusBadge({
        pendingSnapshotIsCurrent: true,
        previewLoading: true,
        searchLoading: false,
        providersLoading: false,
        providersError: '',
        searchError: '',
        activePreviewError: '',
        previewNeedsRefresh: false,
        activePreviewResult: null,
        activeSnapshot: null,
      }),
    ).toEqual({ label: 'Snapshot listo', tone: 'success' });
  });
});
