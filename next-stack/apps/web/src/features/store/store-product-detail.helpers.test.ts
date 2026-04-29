import { describe, expect, it } from 'vitest';
import {
  canPurchaseStoreProduct,
  clampStoreProductQuantity,
  formatStoreProductMoney,
  getAvailableStoreProductColorOptions,
  getStoreProductAvailabilityLabel,
  getStoreProductFallbackDescription,
  requiresStoreProductColorSelection,
  resolveStoreProductStockTone,
} from './store-product-detail.helpers';

describe('store-product-detail.helpers', () => {
  it('formats money and resolves stock tones', () => {
    expect(formatStoreProductMoney(12345)).toBe('$ 12.345');
    expect(resolveStoreProductStockTone(null)).toBe('neutral');
    expect(resolveStoreProductStockTone({ stock: 0 } as never)).toBe('danger');
    expect(resolveStoreProductStockTone({ stock: 2 } as never)).toBe('warning');
    expect(resolveStoreProductStockTone({ stock: 5 } as never)).toBe('success');
  });

  it('clamps quantity using available stock', () => {
    expect(clampStoreProductQuantity(0, 5)).toBe(1);
    expect(clampStoreProductQuantity(99, 3)).toBe(3);
    expect(clampStoreProductQuantity(4, 0)).toBe(1);
  });

  it('builds availability and fallback description', () => {
    expect(getStoreProductAvailabilityLabel(null)).toBe('Consultar disponibilidad');
    expect(getStoreProductAvailabilityLabel({ stock: 4 } as never)).toBe('4 unidades');
    expect(
      getStoreProductFallbackDescription({ description: null } as never),
    ).toContain('Producto listo para compra directa');
    expect(
      getStoreProductFallbackDescription({ description: 'Pantalla AMOLED original' } as never),
    ).toBe('Pantalla AMOLED original');
  });

  it('requires an available color for special order products with color selection', () => {
    const product = {
      fulfillmentMode: 'SPECIAL_ORDER',
      requiresColorSelection: true,
      hasColorOptions: true,
      supplierAvailability: 'IN_STOCK',
      colorOptions: [
        { id: 'red', label: 'Rojo', active: true, supplierAvailability: 'OUT_OF_STOCK' },
        { id: 'black', label: 'Negro', active: true, supplierAvailability: 'IN_STOCK' },
      ],
    } as never;

    expect(requiresStoreProductColorSelection(product)).toBe(true);
    expect(getAvailableStoreProductColorOptions(product)).toEqual([
      { id: 'black', label: 'Negro', active: true, supplierAvailability: 'IN_STOCK' },
    ]);
    expect(canPurchaseStoreProduct(product)).toBe(true);
  });
});
