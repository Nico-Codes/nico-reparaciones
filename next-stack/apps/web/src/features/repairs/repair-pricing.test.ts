import { describe, expect, it } from 'vitest';
import { buildRepairPricingInput, formatSuggestedPriceInput, pricingRuleModeLabel } from './repair-pricing';

describe('repair-pricing helpers', () => {
  it('builds a stable pricing input and key when enough context exists', () => {
    const result = buildRepairPricingInput({
      deviceTypeId: ' type-1 ',
      deviceBrandId: ' brand-2 ',
      deviceIssueTypeId: ' issue-3 ',
      deviceBrand: ' Apple ',
      deviceModel: ' iPhone 13 ',
      issueLabel: ' Display roto ',
    });

    expect(result.canResolve).toBe(true);
    expect(result.reason).toBe('');
    expect(result.input).toEqual({
      deviceTypeId: 'type-1',
      deviceBrandId: 'brand-2',
      deviceModelGroupId: undefined,
      deviceModelId: undefined,
      deviceIssueTypeId: 'issue-3',
      deviceBrand: 'Apple',
      deviceModel: 'iPhone 13',
      issueLabel: 'Display roto',
    });
    expect(result.key).toContain('type-1');
    expect(result.key).toContain('issue-3');
  });

  it('explains why pricing cannot be resolved with missing context', () => {
    const result = buildRepairPricingInput({ deviceBrand: 'Samsung' });

    expect(result.canResolve).toBe(false);
    expect(result.reason).toMatch(/falla/i);
  });

  it('formats suggested prices and labels pricing modes', () => {
    expect(formatSuggestedPriceInput(1234)).toBe('1234');
    expect(formatSuggestedPriceInput(1234.5)).toBe('1234.50');
    expect(
      pricingRuleModeLabel({
        matched: true,
        suggestion: { finalPrice: 10, basePrice: 5, profitPercent: 100, calcMode: 'FIXED_TOTAL' },
      } as any),
    ).toBe('Total fijo');
  });
});
