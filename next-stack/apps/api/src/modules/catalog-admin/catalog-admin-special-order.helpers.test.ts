import { describe, expect, it } from 'vitest';
import {
  parseSpecialOrderListing,
  parseSpecialOrderUsdAmount,
  resolveSpecialOrderPreviewStatus,
} from './catalog-admin-special-order.helpers.js';

describe('catalog-admin-special-order.helpers', () => {
  it('parsea secciones, precios USD y filas sin stock ignorando ruido', () => {
    const parsed = parseSpecialOrderListing(`
> Difusión PDA:
4/23/2026

*Samsung*
Samsung A10 64 GB   $100
Samsung A10 128 GB   Sin Stock
Recuerden que los colores están en
https://docs.google.com/test

*Tablets*
Samsung Tab A9 8.7" 4/64GB   $195
`);

    expect(parsed.sections.map((section) => section.sectionName)).toEqual(['Samsung', 'Tablets']);
    expect(parsed.rows).toHaveLength(3);
    expect(parsed.rows[0]).toMatchObject({
      sectionName: 'Samsung',
      title: 'Samsung A10 64 GB',
      sourcePriceUsd: 100,
      supplierAvailability: 'IN_STOCK',
    });
    expect(parsed.rows[1]).toMatchObject({
      title: 'Samsung A10 128 GB',
      sourcePriceUsd: null,
      supplierAvailability: 'OUT_OF_STOCK',
    });
  });

  it('normaliza montos USD con separadores', () => {
    expect(parseSpecialOrderUsdAmount('$1,325')).toBe(1325);
    expect(parseSpecialOrderUsdAmount('860')).toBe(860);
    expect(parseSpecialOrderUsdAmount('')).toBeNull();
  });

  it('resuelve estados de preview segun cambios reales', () => {
    const unchanged = resolveSpecialOrderPreviewStatus(
      {
        sourcePriceUsd: 100,
        price: 150000,
        costPrice: 100000,
        supplierAvailability: 'IN_STOCK',
        categoryId: 'cat',
        supplierId: 'sup',
        active: true,
        fulfillmentMode: 'SPECIAL_ORDER',
      },
      {
        sourcePriceUsd: 100,
        price: 150000,
        costPrice: 100000,
        supplierAvailability: 'IN_STOCK',
        categoryId: 'cat',
        supplierId: 'sup',
      },
    );
    const priceUpdate = resolveSpecialOrderPreviewStatus(
      {
        sourcePriceUsd: 100,
        price: 150000,
        costPrice: 100000,
        supplierAvailability: 'IN_STOCK',
        categoryId: 'cat',
        supplierId: 'sup',
        active: true,
        fulfillmentMode: 'SPECIAL_ORDER',
      },
      {
        sourcePriceUsd: 105,
        price: 151000,
        costPrice: 105000,
        supplierAvailability: 'IN_STOCK',
        categoryId: 'cat',
        supplierId: 'sup',
      },
    );
    const availabilityUpdate = resolveSpecialOrderPreviewStatus(
      {
        sourcePriceUsd: 100,
        price: 150000,
        costPrice: 100000,
        supplierAvailability: 'IN_STOCK',
        categoryId: 'cat',
        supplierId: 'sup',
        active: true,
        fulfillmentMode: 'SPECIAL_ORDER',
      },
      {
        sourcePriceUsd: 100,
        price: 150000,
        costPrice: 100000,
        supplierAvailability: 'OUT_OF_STOCK',
        categoryId: 'cat',
        supplierId: 'sup',
      },
    );

    expect(unchanged).toBe('unchanged');
    expect(priceUpdate).toBe('price_update');
    expect(availabilityUpdate).toBe('availability_update');
  });
});
