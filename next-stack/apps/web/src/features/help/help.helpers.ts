import type { HelpFaqPublicItem } from './api';

export function filterHelpFaqItems(items: HelpFaqPublicItem[], query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return items;

  return items.filter((item) =>
    `${item.question} ${item.answer} ${item.category}`.toLowerCase().includes(term),
  );
}

export function formatHelpResultLabel(count: number) {
  return `${count} ${count === 1 ? 'resultado' : 'resultados'}`;
}
