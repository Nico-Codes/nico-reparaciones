import { Prisma, type Repair } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  assertValidRepairStatusTransition,
  buildCreatedAtRange,
  detectChangedFields,
  maskPhone,
  normalizeRepairStatus,
} from './repairs.helpers.js';

function makeRepair(overrides: Partial<Repair> = {}): Repair {
  const now = new Date('2026-03-30T12:00:00.000Z');
  return {
    id: 'rep-1',
    userId: 'user-1',
    deviceTypeId: 'type-1',
    deviceBrandId: 'brand-1',
    deviceModelId: 'model-1',
    deviceIssueTypeId: 'issue-1',
    activePricingSnapshotId: 'snapshot-1',
    customerName: 'Cliente Demo',
    customerPhone: '3411234567',
    deviceBrand: 'Samsung',
    deviceModel: 'A54',
    issueLabel: 'Pantalla',
    status: 'RECEIVED',
    quotedPrice: new Prisma.Decimal(1000),
    finalPrice: new Prisma.Decimal(1200),
    notes: 'Nota inicial',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('repairs.helpers', () => {
  it('normalizes statuses and rejects invalid ones', () => {
    expect(normalizeRepairStatus(' repairing ')).toBe('REPAIRING');
    expect(normalizeRepairStatus('otro')).toBeNull();
  });

  it('validates allowed status transitions', () => {
    expect(() => assertValidRepairStatusTransition('RECEIVED', 'WAITING_APPROVAL')).not.toThrow();
    expect(() => assertValidRepairStatusTransition('DELIVERED', 'REPAIRING')).toThrowError(/No se puede cambiar/);
  });

  it('builds inclusive date ranges with exclusive end', () => {
    const range = buildCreatedAtRange('2026-03-01', '2026-03-02');
    expect(range?.gte).toBeInstanceOf(Date);
    expect(range?.lt).toBeInstanceOf(Date);
    expect((range!.lt as Date).getTime() - (range!.gte as Date).getTime()).toBe(2 * 24 * 60 * 60 * 1000);
  });

  it('detects base and money field changes', () => {
    const before = makeRepair();
    const after = makeRepair({
      status: 'WAITING_APPROVAL',
      notes: 'Nota actualizada',
      quotedPrice: new Prisma.Decimal(1500),
    });

    expect(detectChangedFields(before, after)).toEqual(expect.arrayContaining(['status', 'notes', 'quotedPrice']));
  });

  it('masks phone keeping only the last digits', () => {
    expect(maskPhone('3411234567')).toBe('******4567');
  });
});
