import { describe, expect, it } from 'vitest';
import {
  buildPublicRepairLookupFacts,
  buildPublicRepairLookupPayload,
  canSubmitPublicRepairLookup,
} from './public-repair-lookup.helpers';

describe('public-repair-lookup.helpers', () => {
  it('normaliza y arma el payload', () => {
    expect(buildPublicRepairLookupPayload(' NR-1 ', ' 341 ')).toEqual({ repairId: 'NR-1', customerPhone: '341' });
  });

  it('valida submit con ambos campos completos', () => {
    expect(canSubmitPublicRepairLookup('a', 'b')).toBe(true);
    expect(canSubmitPublicRepairLookup('', 'b')).toBe(false);
  });

  it('arma los facts del resultado', () => {
    expect(
      buildPublicRepairLookupFacts({
        customerName: 'Nico',
        customerPhoneMasked: '***',
        deviceBrand: 'Apple',
        deviceModel: 'iPhone',
        issueLabel: 'Pantalla',
        quotedPrice: 10,
        finalPrice: 12,
        createdAt: '2026-04-01T10:00:00.000Z',
        updatedAt: '2026-04-01T11:00:00.000Z',
      } as never),
    ).toHaveLength(8);
  });
});
