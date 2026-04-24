export type NamedOptionItem = {
  id: string;
  name: string;
};

export type ProductSelectOption = {
  value: string;
  label: string;
};

export type ProductMarginStats = {
  utility: number;
  margin: number;
  tone: 'success' | 'warning' | 'danger';
};

export function money(value: number) {
  return `$ ${Math.round(value || 0).toLocaleString('es-AR')}`;
}

export function slugify(raw: string) {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function formatDateTime(value: string | null) {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  return `${date.toLocaleDateString('es-AR')} ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
}

export function buildNamedOptions<T extends NamedOptionItem>(items: T[], emptyLabel: string): ProductSelectOption[] {
  return [{ value: '', label: emptyLabel }, ...items.map((item) => ({ value: item.id, label: item.name }))];
}

export function buildCategoryPathLabel(category: {
  name: string;
  parent?: { name: string } | null;
  pathLabel?: string;
}) {
  if (category.pathLabel) return category.pathLabel;
  if (category.parent?.name) return `${category.parent.name} / ${category.name}`;
  return category.name;
}

export function buildHierarchicalCategoryOptions<
  T extends {
    id: string;
    name: string;
    depth: number;
    parent?: { name: string } | null;
    pathLabel?: string;
  },
>(items: T[], emptyLabel: string): ProductSelectOption[] {
  return [{ value: '', label: emptyLabel }, ...items.map((item) => ({ value: item.id, label: buildCategoryPathLabel(item) }))];
}

export function buildTopLevelCategoryOptions<
  T extends {
    id: string;
    name: string;
    depth: number;
  },
>(items: T[], emptyLabel: string, currentId?: string | null): ProductSelectOption[] {
  return [
    { value: '', label: emptyLabel },
    ...items
      .filter((item) => item.depth === 0 && item.id !== currentId)
      .map((item) => ({ value: item.id, label: item.name })),
  ];
}

export function findCategoryPathLabel<
  T extends {
    id: string;
    name: string;
    parent?: { name: string } | null;
    pathLabel?: string;
  },
>(items: T[], categoryId: string, fallback = 'Sin categoria') {
  if (!categoryId) return fallback;
  const found = items.find((item) => item.id === categoryId);
  return found ? buildCategoryPathLabel(found) : fallback;
}

export function buildProductMarginStats(costPrice: string, price: string): ProductMarginStats {
  const cost = Number(costPrice || 0);
  const sale = Number(price || 0);
  const utility = sale - cost;
  const margin = cost > 0 ? (utility / cost) * 100 : 0;
  const tone: ProductMarginStats['tone'] = utility > 0 ? 'success' : utility === 0 ? 'warning' : 'danger';
  return { utility, margin, tone };
}
