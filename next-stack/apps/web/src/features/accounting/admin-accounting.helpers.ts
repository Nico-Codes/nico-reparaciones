import type { AdminAccountingItem } from '@/features/admin/api';

export type AccountingDirectionFilter = '' | 'inflow' | 'outflow';

export type AccountingCategorySummaryItem = {
  category: string;
  entriesCount: number;
  inflowTotal: number;
  outflowTotal: number;
  netTotal: number;
};

export type AccountingSummary = {
  entriesCount: number;
  inflowTotal: number;
  outflowTotal: number;
  netTotal: number;
};

export const ACCOUNTING_DIRECTION_OPTIONS = [
  { value: '', label: 'Direccion: Todas' },
  { value: 'inflow', label: 'Ingreso' },
  { value: 'outflow', label: 'Egreso' },
];

export function formatAccountingMoney(value: number) {
  return `$ ${value.toLocaleString('es-AR')}`;
}

export function buildAccountingCategoryOptions(categories: string[]) {
  return [
    { value: '', label: 'Categoria: Todas' },
    ...categories.map((category) => ({ value: category, label: category })),
  ];
}

export function buildAccountingRequestParams(input: {
  q: string;
  direction: AccountingDirectionFilter;
  category: string;
  from: string;
  to: string;
}) {
  return {
    q: input.q.trim() || undefined,
    direction: input.direction || undefined,
    category: input.category || undefined,
    from: input.from || undefined,
    to: input.to || undefined,
  };
}

export function resolveAccountingNetTone(value: number) {
  return value >= 0 ? 'text-emerald-700' : 'text-rose-700';
}

export function resolveAccountingDirectionClass(direction: AdminAccountingItem['direction']) {
  return direction === 'Ingreso'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-rose-200 bg-rose-50 text-rose-700';
}

export function resolveAccountingAmountTone(direction: AdminAccountingItem['direction']) {
  return direction === 'Ingreso' ? 'text-emerald-700' : 'text-rose-700';
}

export function hasAccountingFilters(input: {
  q: string;
  direction: AccountingDirectionFilter;
  category: string;
}) {
  return input.q.trim().length > 0 || input.direction.length > 0 || input.category.length > 0;
}
