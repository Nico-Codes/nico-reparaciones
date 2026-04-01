import type { HelpFaqAdminItem, HelpFaqUpdateInput } from './helpFaqApi';

export type HelpFaqFormState = {
  question: string;
  answer: string;
  category: string;
  sortOrder: string;
  active: boolean;
};

export function sortHelpFaqItems(rows: HelpFaqAdminItem[]) {
  return [...rows].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function buildHelpFaqCategoryOptions(items: HelpFaqAdminItem[]) {
  const categories = Array.from(new Set(items.map((item) => item.category).filter(Boolean))).sort();
  return [{ value: '', label: 'Todas las categorias' }, ...categories.map((category) => ({ value: category, label: category }))];
}

export function buildHelpFaqCreateInput(form: HelpFaqFormState) {
  return {
    question: form.question.trim(),
    answer: form.answer.trim(),
    category: form.category || 'general',
    sortOrder: Number(form.sortOrder || 0),
    active: form.active,
  };
}

export function updateHelpFaqItems(rows: HelpFaqAdminItem[], id: string, patch: Partial<HelpFaqAdminItem>) {
  return rows.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
}

export function resolveHelpFaqError(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}

export function buildHelpFaqUpdateInput(item: HelpFaqAdminItem): HelpFaqUpdateInput {
  return {
    question: item.question,
    answer: item.answer,
    category: item.category,
    sortOrder: item.sortOrder,
    active: item.active,
  };
}
