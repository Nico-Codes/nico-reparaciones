import { describe, expect, it } from 'vitest';
import { AdminProviderSearchService } from './admin-provider-search.service.js';

function createService() {
  return new AdminProviderSearchService({} as never);
}

describe('AdminProviderSearchService', () => {
  it('parses mixed locale prices consistently', () => {
    const service = createService();

    expect((service as any).parseMoneyValue('$ 12.345,67')).toBe(12345.67);
    expect((service as any).parseMoneyValue('ARS 8999')).toBe(8999);
  });

  it('normalizes availability labels from supplier text', () => {
    const service = createService();

    expect((service as any).normalizeAvailability('Sin stock')).toBe('out_of_stock');
    expect((service as any).normalizeAvailability('Disponible')).toBe('in_stock');
    expect((service as any).normalizeAvailability('')).toBe('unknown');
  });
});
