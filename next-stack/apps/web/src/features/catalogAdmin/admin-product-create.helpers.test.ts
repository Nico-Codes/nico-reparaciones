import { describe, expect, it } from 'vitest';
import {
  buildAdminProductCreatePayload,
  buildAdminProductCreateSummary,
  validateAdminProductCreateDraft,
} from './admin-product-create.helpers';

describe('admin-product-create.helpers', () => {
  it('validates name/slug and negative margin guard', () => {
    expect(
      validateAdminProductCreateDraft(
        {
          name: '',
          slug: '',
          costPrice: '10',
          price: '12',
        },
        true,
      ),
    ).toBe('Completa un nombre valido para generar el producto.');

    expect(
      validateAdminProductCreateDraft(
        {
          name: 'Bateria iPhone',
          slug: '',
          costPrice: '20',
          price: '10',
        },
        true,
      ),
    ).toBe('El precio de venta no puede quedar por debajo del costo mientras el guard de margen este activo.');

    expect(
      validateAdminProductCreateDraft(
        {
          name: 'Bateria iPhone',
          slug: '',
          costPrice: '20',
          price: '10',
        },
        false,
      ),
    ).toBeNull();
  });

  it('builds normalized payload for create product', () => {
    expect(
      buildAdminProductCreatePayload({
        name: '  Bateria iPhone  ',
        slug: '',
        sku: ' SKU-1 ',
        barcode: '',
        categoryId: 'cat-1',
        supplierId: '',
        purchaseRef: ' F001 ',
        costPrice: '25',
        price: '40',
        stock: '3.9',
        description: '  detalle  ',
        featured: true,
        active: false,
      }),
    ).toEqual({
      name: 'Bateria iPhone',
      slug: 'bateria-iphone',
      sku: 'SKU-1',
      barcode: null,
      categoryId: 'cat-1',
      supplierId: null,
      purchaseReference: 'F001',
      costPrice: 25,
      price: 40,
      stock: 3,
      description: 'detalle',
      featured: true,
      active: false,
    });
  });

  it('builds the summary sidebar using category and supplier names', () => {
    expect(
      buildAdminProductCreateSummary(
        {
          name: 'Modulo',
          categoryId: 'cat-1',
          supplierId: 'sup-1',
          price: '10000',
        },
        'modulo',
        [
          {
            id: 'cat-1',
            name: 'Repuestos',
            slug: 'repuestos',
            parentId: null,
            parent: null,
            depth: 0,
            active: true,
            directProductsCount: 1,
            totalProductsCount: 1,
            productsCount: 1,
            childrenCount: 0,
            pathLabel: 'Repuestos',
          },
        ],
        [{ id: 'sup-1', name: 'Proveedor Uno' }],
      ),
    ).toEqual([
      { label: 'Nombre', value: 'Modulo' },
      { label: 'Slug final', value: 'modulo' },
      { label: 'Categoria', value: 'Repuestos' },
      { label: 'Proveedor', value: 'Proveedor Uno' },
      { label: 'Venta', value: '$ 10.000', tone: 'money' },
    ]);
  });
});
