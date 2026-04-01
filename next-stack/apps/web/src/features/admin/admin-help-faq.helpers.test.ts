import { describe, expect, it } from 'vitest';
import { buildHelpFaqCategoryOptions, buildHelpFaqCreateInput, sortHelpFaqItems } from './admin-help-faq.helpers';

describe('admin-help-faq.helpers', () => {
  it('ordena activas primero y por sortOrder', () => {
    const sorted = sortHelpFaqItems([
      { id: '2', active: false, sortOrder: 0, createdAt: '2026-04-01', category: '', question: '', answer: '', updatedAt: '' },
      { id: '1', active: true, sortOrder: 2, createdAt: '2026-04-01', category: '', question: '', answer: '', updatedAt: '' },
      { id: '3', active: true, sortOrder: 1, createdAt: '2026-04-01', category: '', question: '', answer: '', updatedAt: '' },
    ] as never);
    expect(sorted.map((item) => item.id)).toEqual(['3', '1', '2']);
  });

  it('arma opciones de categoria unicas', () => {
    expect(buildHelpFaqCategoryOptions([{ category: 'general' }, { category: 'ventas' }, { category: 'general' }] as never)).toHaveLength(3);
  });

  it('normaliza el payload de alta', () => {
    expect(buildHelpFaqCreateInput({ question: ' A ', answer: ' B ', category: '', sortOrder: '2', active: true })).toEqual({
      question: 'A',
      answer: 'B',
      category: 'general',
      sortOrder: 2,
      active: true,
    });
  });
});
