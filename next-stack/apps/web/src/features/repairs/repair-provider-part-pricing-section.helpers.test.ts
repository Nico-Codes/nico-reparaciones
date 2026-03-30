import { describe, expect, it } from 'vitest';
import {
  availabilityLabel,
  buildProviderFilterOptions,
  parseOptionalMoney,
  parsePositiveInteger,
  partKey,
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
});
