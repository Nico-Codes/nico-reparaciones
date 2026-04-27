import { describe, expect, it } from 'vitest';
import {
  extractSpecialOrderColorLabel,
  googleSheetUrlToCsvExportUrl,
  normalizeSpecialOrderProductBaseTitle,
  normalizeSpecialOrderText,
  parseSpecialOrderColorCsv,
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

  it('normaliza capacidades equivalentes para matching', () => {
    expect(normalizeSpecialOrderText('iPhone 17 Pro 256GB')).toBe(normalizeSpecialOrderText('iPhone 17 Pro 256 GB'));
    expect(normalizeSpecialOrderText('Samsung S26 Ultra 12/512GB')).toBe(
      normalizeSpecialOrderText('Samsung S26 Ultra 12/512 GB'),
    );
    expect(normalizeSpecialOrderText('iPad Pro 1TB')).toBe(normalizeSpecialOrderText('iPad Pro 1 TB'));
  });

  it('quita hints de color finales del TXT sin quitar parentesis tecnicos', () => {
    expect(normalizeSpecialOrderProductBaseTitle('iPhone 17 Pro 256 GB (Naranja, Azul)')).toBe('iPhone 17 Pro 256 GB');
    expect(normalizeSpecialOrderProductBaseTitle('Xiaomi 15 Ultra 512 GB (con Leica)')).toBe(
      'Xiaomi 15 Ultra 512 GB (con Leica)',
    );
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

  it('parsea CSV de colores con secciones y stock por fila', () => {
    const parsed = parseSpecialOrderColorCsv(`
"IPHONE"
"iPhone 16 128 GB Teal (Verde Azulado)Stock"
"iPhone 16 128 GB Rosa Sin Stock"
"POCO"
"Poco X7 Pro 12/512 GB Negro Stock"
`);

    expect(parsed.sections.map((section) => section.sectionName)).toEqual(['IPHONE', 'POCO']);
    expect(parsed.rows).toHaveLength(3);
    expect(parsed.rows[0]).toMatchObject({
      sectionName: 'IPHONE',
      title: 'iPhone 16 128 GB Teal (Verde Azulado)',
      supplierAvailability: 'IN_STOCK',
    });
    expect(parsed.rows[1]).toMatchObject({
      title: 'iPhone 16 128 GB Rosa',
      supplierAvailability: 'OUT_OF_STOCK',
    });
  });

  it('parsea el CSV real exportado por Google Sheets con modelo, color y estado en columnas separadas', () => {
    const parsed = parseSpecialOrderColorCsv(`
,,,,
,IPHONE,,,
,iPhone 15 128 GB,Negro,,Sin Stock
,iPhone 16 128 GB,Teal (Verde Azulado),,Stock
,POCO,,,
,Poco X8 Pro 8/256 GB,Verde menta,,Stock
`);

    expect(parsed.sections.map((section) => section.sectionName)).toEqual(['IPHONE', 'POCO']);
    expect(parsed.rows).toHaveLength(3);
    expect(parsed.rows[0]).toMatchObject({
      sectionName: 'IPHONE',
      title: 'iPhone 15 128 GB Negro',
      supplierAvailability: 'OUT_OF_STOCK',
    });
    expect(parsed.rows[1]).toMatchObject({
      title: 'iPhone 16 128 GB Teal (Verde Azulado)',
      supplierAvailability: 'IN_STOCK',
    });
    expect(parsed.rows[2]).toMatchObject({
      sectionName: 'POCO',
      title: 'Poco X8 Pro 8/256 GB Verde menta',
      supplierAvailability: 'IN_STOCK',
    });
  });

  it('parsea CSV regional separado por punto y coma', () => {
    const parsed = parseSpecialOrderColorCsv(`
SAMSUNG;;;
Samsung A17 8/256 GB;Negro;;Stock
Samsung A17 8/256 GB;Azul claro;;Sin Stock
`);

    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]).toMatchObject({
      title: 'Samsung A17 8/256 GB Negro',
      supplierAvailability: 'IN_STOCK',
    });
    expect(parsed.rows[1]).toMatchObject({
      title: 'Samsung A17 8/256 GB Azul claro',
      supplierAvailability: 'OUT_OF_STOCK',
    });
  });

  it('convierte una URL publica de Google Sheets a export CSV', () => {
    expect(
      googleSheetUrlToCsvExportUrl(
        'https://docs.google.com/spreadsheets/d/1SfR8dxL9CPI1jkWxs-Y7tldJGLKR0xYsWte2VVaYz4U/edit?gid=0#gid=0',
      ),
    ).toBe(
      'https://docs.google.com/spreadsheets/d/1SfR8dxL9CPI1jkWxs-Y7tldJGLKR0xYsWte2VVaYz4U/export?format=csv&gid=0',
    );
  });

  it('extrae el color remanente despues de matchear el producto base', () => {
    expect(
      extractSpecialOrderColorLabel({
        rowTitle: 'Xiaomi Redmi 15C 8/256 GB Azul',
        normalizedRowTitle: 'xiaomi redmi 15c 8 256 gb azul',
        productTitle: 'Xiaomi Redmi 15C 8/256 GB',
        productSectionName: 'XIAOMI',
      }),
    ).toBe('Azul');
  });

  it('limpia prefijos tecnicos cuando quedan delante del color real', () => {
    expect(
      extractSpecialOrderColorLabel({
        rowTitle: 'Samsung S26 Ultra 12/256 GB 5G DS Negro',
        normalizedRowTitle: normalizeSpecialOrderText('Samsung S26 Ultra 12/256 GB 5G DS Negro'),
        productTitle: 'Samsung S26 Ultra 12/256 GB',
        productSectionName: 'SAMSUNG',
      }),
    ).toBe('Negro');
  });

  it('unifica filas de TXT cuando el color venia entre parentesis', () => {
    const parsed = parseSpecialOrderListing(`
*IPHONE*
iPhone 17 Pro 256 GB (Naranja, Azul) $1325
`);

    expect(parsed.rows[0]).toMatchObject({
      title: 'iPhone 17 Pro 256 GB',
      sourceKey: normalizeSpecialOrderText('IPHONE iPhone 17 Pro 256 GB'),
    });
  });
});
