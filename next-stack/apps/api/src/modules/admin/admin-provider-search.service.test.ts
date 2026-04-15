import { describe, expect, it } from 'vitest';
import { buildPartSearchQueryProfile, matchesSupplierPartExactQuery, rankSupplierPart } from './admin-provider-search-ranking.js';
import { normalizeAvailability, parseMoneyValue } from './admin-provider-search.text.js';
import type { NormalizedSupplierPartWithProvider } from './admin-providers.types.js';

describe('admin-provider-search helpers', () => {
  it('parses mixed locale prices consistently', () => {
    expect(parseMoneyValue('$ 12.345,67')).toBe(12345.67);
    expect(parseMoneyValue('ARS 8999')).toBe(8999);
  });

  it('normalizes availability labels from supplier text', () => {
    expect(normalizeAvailability('Sin stock')).toBe('out_of_stock');
    expect(normalizeAvailability('Disponible')).toBe('in_stock');
    expect(normalizeAvailability('')).toBe('unknown');
  });

  it('prioritizes closer supplier matches in ranking', () => {
    const profile = buildPartSearchQueryProfile('modulo a30 samsung');
    const strongMatch: NormalizedSupplierPartWithProvider = {
      externalPartId: 'p1',
      name: 'Modulo Samsung A30 original',
      sku: 'A30-ORI',
      brand: 'Samsung',
      price: 15000,
      availability: 'in_stock',
      url: 'https://supplier.test/producto/modulo-samsung-a30',
      rawLabel: 'Modulo Samsung A30 original',
      supplier: {
        id: 'sup-1',
        name: 'Proveedor 1',
        priority: 10,
        endpoint: 'https://supplier.test',
        mode: 'html',
      },
    };
    const weakMatch: NormalizedSupplierPartWithProvider = {
      ...strongMatch,
      externalPartId: 'p2',
      name: 'Pantalla generica',
      sku: null,
      brand: null,
      price: 50,
      availability: 'unknown',
      url: 'https://supplier.test/shop',
      rawLabel: 'Pantalla generica',
    };

    expect(rankSupplierPart(strongMatch, profile)).toBeGreaterThan(rankSupplierPart(weakMatch, profile));
  });

  it('rejects irrelevant supplier results for exact queries', () => {
    const profile = buildPartSearchQueryProfile('modulo redmi 13c');

    expect(
      matchesSupplierPartExactQuery(
        {
          externalPartId: 'p-samsung',
          name: 'Modulo Samsung A13 Original',
          sku: 'A13-ORI',
          brand: 'Samsung',
          price: 15000,
          availability: 'in_stock',
          url: 'https://supplier.test/producto/modulo-samsung-a13',
          rawLabel: 'Modulo Samsung A13 Original',
          supplier: {
            id: 'sup-1',
            name: 'Proveedor 1',
            priority: 10,
            endpoint: 'https://supplier.test',
            mode: 'html',
          },
        },
        profile,
      ),
    ).toBe(false);

    expect(
      matchesSupplierPartExactQuery(
        {
          externalPartId: 'p-battery',
          name: 'Bateria Xiaomi Redmi 13C',
          sku: 'BAT-13C',
          brand: 'Xiaomi',
          price: 9000,
          availability: 'in_stock',
          url: 'https://supplier.test/producto/bateria-redmi-13c',
          rawLabel: 'Bateria Xiaomi Redmi 13C',
          supplier: {
            id: 'sup-1',
            name: 'Proveedor 1',
            priority: 10,
            endpoint: 'https://supplier.test',
            mode: 'html',
          },
        },
        profile,
      ),
    ).toBe(false);
  });

  it('accepts exact matches with model prefixes like A13 -> A135F', () => {
    const profile = buildPartSearchQueryProfile('modulo a13');

    expect(
      matchesSupplierPartExactQuery(
        {
          externalPartId: 'p-a135f',
          name: 'Modulo Samsung A13 A135F Original',
          sku: 'A135F-ORI',
          brand: 'Samsung',
          price: 17500,
          availability: 'in_stock',
          url: 'https://supplier.test/producto/modulo-samsung-a13-a135f',
          rawLabel: 'Modulo Samsung A13 A135F Original',
          supplier: {
            id: 'sup-1',
            name: 'Proveedor 1',
            priority: 10,
            endpoint: 'https://supplier.test',
            mode: 'html',
          },
        },
        profile,
      ),
    ).toBe(true);
  });
});
