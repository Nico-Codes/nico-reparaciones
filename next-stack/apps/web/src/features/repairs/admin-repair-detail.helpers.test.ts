import { describe, expect, it } from 'vitest';
import {
  buildRepairDetailPatch,
  eventTypeLabel,
  hasRepairDetailChanges,
  parseOptionalMoney,
  validatePhone,
} from './admin-repair-detail.helpers';

describe('admin-repair-detail helpers', () => {
  it('validates phone digits with sane limits', () => {
    expect(validatePhone('')).toBe('');
    expect(validatePhone('11 5555-1234')).toBe('');
    expect(validatePhone('123')).toMatch(/al menos 6 digitos/i);
    expect(validatePhone('123456789012345678901')).toMatch(/20 digitos/i);
  });

  it('parses optional money fields with locale tolerance', () => {
    expect(parseOptionalMoney('', 'presupuesto')).toEqual({ value: null, error: '' });
    expect(parseOptionalMoney('125,5', 'precio final')).toEqual({ value: 125.5, error: '' });
    expect(parseOptionalMoney('-1', 'presupuesto').error).toMatch(/valido/i);
  });

  it('detects relevant form changes and builds a narrow patch', () => {
    const item = {
      id: 'rep-1',
      customerName: 'Nico',
      customerPhone: '1155551234',
      deviceBrand: 'Samsung',
      deviceModel: 'A34',
      issueLabel: 'Modulo',
      status: 'RECEIVED',
      quotedPrice: 100,
      finalPrice: null,
      notes: 'Inicial',
    } as any;

    const sameDraft = {
      customerName: 'Nico',
      customerPhone: '1155551234',
      deviceBrand: 'Samsung',
      deviceModel: 'A34',
      issueLabel: 'Modulo',
      status: 'RECEIVED',
      quotedPrice: 100,
      finalPrice: null,
      notes: 'Inicial',
    };

    expect(hasRepairDetailChanges(item, sameDraft, null)).toBe(false);

    const changedDraft = { ...sameDraft, quotedPrice: 150, notes: 'Actualizado' };
    expect(hasRepairDetailChanges(item, changedDraft, null)).toBe(true);
    expect(buildRepairDetailPatch(item, changedDraft, null)).toEqual({
      quotedPrice: 150,
      notes: 'Actualizado',
    });
  });

  it('keeps human labels for timeline events', () => {
    expect(eventTypeLabel('CREATED')).toBe('Alta del caso');
    expect(eventTypeLabel('STATUS_CHANGED')).toBe('Cambio de estado');
    expect(eventTypeLabel('CUSTOM')).toBe('CUSTOM');
  });
});
