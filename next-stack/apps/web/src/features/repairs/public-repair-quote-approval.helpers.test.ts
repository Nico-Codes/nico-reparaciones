import { describe, expect, it } from 'vitest';
import {
  buildPublicRepairQuoteApprovalFacts,
  buildPublicRepairQuoteApprovalMeta,
  canLoadPublicRepairQuoteApproval,
} from './public-repair-quote-approval.helpers';

describe('public-repair-quote-approval.helpers', () => {
  it('valida id y token antes de cargar', () => {
    expect(canLoadPublicRepairQuoteApproval('abc', 'tok')).toBe(true);
    expect(canLoadPublicRepairQuoteApproval('', 'tok')).toBe(false);
  });

  it('arma facts del presupuesto', () => {
    expect(
      buildPublicRepairQuoteApprovalFacts({
        customerName: 'Nico',
        customerPhoneMasked: '***',
        deviceBrand: 'Apple',
        deviceModel: 'iPhone',
        issueLabel: 'Pantalla',
        quotedPrice: 10,
        finalPrice: 12,
        updatedAt: '2026-04-01T11:00:00.000Z',
      } as never),
    ).toHaveLength(6);
  });

  it('arma metadatos derivados del estado', () => {
    expect(buildPublicRepairQuoteApprovalMeta({ status: 'WAITING_APPROVAL' } as never).description).toBeTruthy();
  });
});
