import { describe, expect, it } from 'vitest';
import { filterHelpFaqItems, formatHelpResultLabel } from './help.helpers';
import type { HelpFaqPublicItem } from './api';

const items: HelpFaqPublicItem[] = [
  {
    id: '1',
    question: 'Como retiro mi pedido?',
    answer: 'Podes retirar por el local.',
    category: 'pedidos',
  },
  {
    id: '2',
    question: 'Como apruebo una reparacion?',
    answer: 'Desde el link de seguimiento.',
    category: 'reparaciones',
  },
];

describe('help.helpers', () => {
  it('filters FAQ by question, answer or category', () => {
    expect(filterHelpFaqItems(items, '')).toEqual(items);
    expect(filterHelpFaqItems(items, ' local ')).toEqual([items[0]]);
    expect(filterHelpFaqItems(items, 'reparaciones')).toEqual([items[1]]);
    expect(filterHelpFaqItems(items, 'sin resultados')).toEqual([]);
  });

  it('formats result counters', () => {
    expect(formatHelpResultLabel(0)).toBe('0 resultados');
    expect(formatHelpResultLabel(1)).toBe('1 resultado');
    expect(formatHelpResultLabel(3)).toBe('3 resultados');
  });
});
