import { describe, expect, it } from 'vitest';
import type { AdminProviderItem } from '@/features/admin/api';
import type { AdminProduct } from '@/features/catalogAdmin/api';
import type { RepairItem } from '@/features/repairs/types';
import {
  applyProductSelection,
  applyRepairSelection,
  buildProductOptions,
  buildProviderOptions,
  buildRepairOptions,
  buildSelectedRepairLabel,
  buildWarrantyCreatePayload,
  computeEstimatedLoss,
  createDefaultWarrantyForm,
  repairCode,
  resolveWarrantyCostOrigin,
  validateWarrantyCreateForm,
} from './admin-warranty-create.helpers';

function makeRepair(
  input: Partial<RepairItem> & Pick<RepairItem, 'id' | 'customerName' | 'createdAt' | 'updatedAt' | 'status'>,
): RepairItem {
  return {
    userId: null,
    customerPhone: null,
    deviceBrand: null,
    deviceModel: null,
    issueLabel: null,
    quotedPrice: null,
    finalPrice: null,
    notes: null,
    ...input,
  };
}

function makeProduct(
  input: Partial<AdminProduct> & Pick<AdminProduct, 'id' | 'name' | 'price' | 'stock' | 'active' | 'featured'>,
): AdminProduct {
  return {
    slug: 'producto',
    description: null,
    purchaseReference: null,
    imagePath: null,
    imageUrl: null,
    costPrice: null,
    sku: null,
    barcode: null,
    categoryId: null,
    category: null,
    supplierId: null,
    supplier: null,
    createdAt: null,
    updatedAt: null,
    ...input,
  };
}

function makeProvider(input: Partial<AdminProviderItem> & Pick<AdminProviderItem, 'id' | 'name'>): AdminProviderItem {
  return {
    priority: 1,
    phone: '',
    products: 0,
    incidents: 0,
    warrantiesOk: 0,
    warrantiesExpired: 0,
    loss: 0,
    score: 0,
    confidenceLabel: '',
    active: true,
    searchEnabled: false,
    searchInRepairs: false,
    statusProbe: 'none',
    lastProbeAt: '',
    lastQuery: '',
    lastResults: 0,
    mode: 'json',
    endpoint: '',
    configJson: '',
    notes: '',
    ...input,
  };
}

describe('admin-warranty-create.helpers', () => {
  it('builds derived labels and options for repairs, products and providers', () => {
    const injectedRepair = makeRepair({
      id: 'repair-1234567890123',
      customerName: 'Juan',
      createdAt: '2026-03-31T10:00:00.000Z',
      updatedAt: '2026-03-31T10:00:00.000Z',
      status: 'RECEIVED',
    });
    const product = makeProduct({
      id: 'product-1',
      name: 'Modulo',
      sku: 'SKU-1',
      price: 1,
      stock: 1,
      active: true,
      featured: false,
    });
    const provider = makeProvider({ id: 'provider-1', name: 'Proveedor 1' });

    expect(repairCode(injectedRepair.id)).toBe('R-repair-123456');
    expect(buildSelectedRepairLabel(injectedRepair)).toContain('Juan');
    expect(buildRepairOptions([], injectedRepair)).toHaveLength(2);
    expect(buildProductOptions([product])[1]).toEqual({ value: 'product-1', label: 'Modulo (SKU-1)' });
    expect(buildProviderOptions([provider])[1]).toEqual({ value: 'provider-1', label: 'Proveedor 1' });
  });

  it('applies repair and product context while computing loss and payload', () => {
    const repair = makeRepair({
      id: 'repair-1',
      customerName: 'Maria',
      quotedPrice: 12500,
      createdAt: '2026-03-31T10:00:00.000Z',
      updatedAt: '2026-03-31T10:00:00.000Z',
      status: 'RECEIVED',
    });
    const product = makeProduct({
      id: 'product-1',
      name: 'Pantalla',
      price: 1,
      stock: 1,
      active: true,
      featured: false,
      supplierId: 'provider-1',
      costPrice: 9900,
    });
    const baseForm = createDefaultWarrantyForm();

    const repairForm = applyRepairSelection({ ...baseForm, title: '' }, repair);
    expect(repairForm.unitCost).toBe('12500');
    expect(repairForm.title).toContain('Garantia reparacion');

    const productForm = applyProductSelection({ ...baseForm, title: '', source: 'PRODUCT' }, 'product-1', product);
    expect(productForm.productId).toBe('product-1');
    expect(productForm.providerId).toBe('provider-1');
    expect(productForm.unitCost).toBe('9900');

    expect(
      computeEstimatedLoss({
        qty: '2',
        unitCost: '100',
        extraCost: '30',
        recoveredAmount: '20',
      }),
    ).toBe(210);

    expect(resolveWarrantyCostOrigin('REPAIR', repair, null)).toBe('repair');
    expect(resolveWarrantyCostOrigin('PRODUCT', null, product)).toBe('product');
    expect(buildWarrantyCreatePayload(productForm, '', null, product)).toMatchObject({
      sourceType: 'product',
      productId: 'product-1',
      supplierId: 'provider-1',
      costOrigin: 'product',
    });
  });

  it('validates required associations before submit', () => {
    const form = createDefaultWarrantyForm();
    expect(validateWarrantyCreateForm({ ...form, title: '' }, '')).toBe('El titulo es obligatorio');
    expect(validateWarrantyCreateForm(form, '')).toBe('Selecciona la reparacion asociada');
    expect(
      validateWarrantyCreateForm({ ...form, source: 'PRODUCT', productId: '' }, ''),
    ).toBe('Selecciona el producto asociado');
    expect(
      validateWarrantyCreateForm({ ...form, source: 'PRODUCT', productId: 'product-1' }, ''),
    ).toBe('');
  });
});
