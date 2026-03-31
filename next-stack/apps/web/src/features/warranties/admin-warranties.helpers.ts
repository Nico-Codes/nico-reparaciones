import type { AdminWarrantyItem } from '@/features/admin/api';

export type WarrantySourceTypeFilter = '' | 'repair' | 'product';
export type WarrantyStatusFilter = '' | 'open' | 'closed';

export type AdminWarrantiesFilters = {
  q: string;
  sourceType: WarrantySourceTypeFilter;
  status: WarrantyStatusFilter;
  from: string;
  to: string;
};

export type AdminWarrantiesSummary = {
  totalCount: number;
  openCount: number;
  closedCount: number;
  totalLoss: number;
};

export type AdminWarrantySupplierStat = {
  supplierId: string;
  name: string;
  incidentsCount: number;
  totalLoss: number;
};

export const warrantySourceTypeOptions = [
  { value: '', label: 'Origen: Todos' },
  { value: 'repair', label: 'Reparacion' },
  { value: 'product', label: 'Producto' },
];

export const warrantyStatusOptions = [
  { value: '', label: 'Estado: Todos' },
  { value: 'open', label: 'Abierto' },
  { value: 'closed', label: 'Cerrado' },
];

export function createDefaultAdminWarrantiesFilters(): AdminWarrantiesFilters {
  return {
    q: '',
    sourceType: '',
    status: '',
    from: '',
    to: '',
  };
}

export function createDefaultAdminWarrantiesSummary(): AdminWarrantiesSummary {
  return {
    totalCount: 0,
    openCount: 0,
    closedCount: 0,
    totalLoss: 0,
  };
}

export function buildAdminWarrantiesQuery(filters: AdminWarrantiesFilters) {
  return {
    q: filters.q.trim() || undefined,
    sourceType: filters.sourceType || undefined,
    status: filters.status || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  };
}

export function formatWarrantyMoney(value: number) {
  return `$ ${value.toLocaleString('es-AR')}`;
}

export function getTopWarrantySupplier(supplierStats: AdminWarrantySupplierStat[]) {
  return supplierStats[0] ?? null;
}

export function getWarrantyStatusBadgeClass(status: AdminWarrantyItem['status']) {
  return status === 'closed'
    ? 'border-zinc-200 bg-zinc-100 text-zinc-700'
    : 'border-amber-300 bg-amber-50 text-amber-700';
}

export function buildWarrantyRelatedLine(item: AdminWarrantyItem) {
  if (item.sourceType === 'repair') {
    return `Reparacion: ${item.repairCode ?? '-'}${item.customerName ? ` - ${item.customerName}` : ''}`;
  }

  return `Producto: ${item.productName || '-'}`;
}

export function buildAdminWarrantiesStatCards(summary: AdminWarrantiesSummary) {
  return [
    { title: 'TOTAL INCIDENTES', value: String(summary.totalCount) },
    { title: 'ABIERTOS', value: String(summary.openCount), valueClass: 'text-amber-600' },
    { title: 'CERRADOS', value: String(summary.closedCount) },
    { title: 'PERDIDA ACUMULADA', value: formatWarrantyMoney(summary.totalLoss), valueClass: 'text-rose-700' },
  ];
}
