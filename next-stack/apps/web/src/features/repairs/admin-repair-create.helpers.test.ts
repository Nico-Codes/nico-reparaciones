import { describe, expect, it } from 'vitest';
import {
  buildRepairCreateDevicePreview,
  buildRepairCreatePayload,
  parseOptionalMoney,
  validatePhone,
  validateRepairCreateForm,
} from './admin-repair-create.helpers';

describe('admin-repair-create helpers', () => {
  it('validates phone digits with sane limits', () => {
    expect(validatePhone('')).toBe('');
    expect(validatePhone('11 5555-1234')).toBe('');
    expect(validatePhone('123')).toMatch(/al menos 6 digitos/i);
  });

  it('parses optional money fields with locale tolerance', () => {
    expect(parseOptionalMoney('').value).toBeNull();
    expect(parseOptionalMoney('125,5')).toEqual({ value: 125.5, error: '' });
    expect(parseOptionalMoney('-1').error).toMatch(/valido/i);
  });

  it('builds a compact device preview', () => {
    expect(buildRepairCreateDevicePreview('Samsung', 'A34')).toBe('Samsung A34');
    expect(buildRepairCreateDevicePreview(null, null)).toBe('Pendiente de definir');
  });

  it('returns form errors and payloads with normalized nullable values', () => {
    expect(
      validateRepairCreateForm({
        customerName: 'N',
        customerPhone: '123',
        quotedPriceError: '',
        quotedPriceValue: null,
        pendingPricingSnapshotDraft: { source: 'SUPPLIER_PART' } as any,
      }),
    ).toEqual({
      customerName: 'Ingresa al menos 2 caracteres para identificar al cliente.',
      customerPhone: 'Ingresa un telefono valido con al menos 6 digitos.',
      quotedPrice: 'Define un presupuesto antes de guardar un snapshot aplicado.',
    });

    expect(
      buildRepairCreatePayload({
        form: {
          customerName: ' Nico ',
          customerPhone: '',
          deviceTypeId: '',
          deviceBrandId: '',
          deviceModelId: '',
          deviceIssueTypeId: '',
          deviceBrand: '',
          deviceModel: '',
          issueLabel: '',
          quotedPrice: '',
          notes: '  ',
        },
        resolved: {
          brand: null,
          model: null,
          issue: null,
          quotedPrice: null,
        },
        pendingPricingSnapshotDraft: null,
      }),
    ).toEqual({
      customerName: 'Nico',
      customerPhone: null,
      deviceTypeId: null,
      deviceBrandId: null,
      deviceModelId: null,
      deviceIssueTypeId: null,
      deviceBrand: null,
      deviceModel: null,
      issueLabel: null,
      quotedPrice: null,
      notes: null,
      pricingSnapshotDraft: null,
    });
  });
});
