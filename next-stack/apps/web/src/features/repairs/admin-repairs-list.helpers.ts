import { formatDateTime, money, REPAIR_STATUS_LABELS, repairCode, repairStatusLabel, repairStatusTone } from './repair-ui';
import type { RepairItem } from './types';

export { formatDateTime, money, repairCode, repairStatusLabel, repairStatusTone };

export const REPAIR_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  ...Object.entries(REPAIR_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export function timeAgo(dateIso: string) {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 60) return `hace ${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} dia${days === 1 ? '' : 's'}`;
  const weeks = Math.floor(days / 7);
  return `hace ${weeks} semana${weeks === 1 ? '' : 's'}`;
}

export function hasAdminRepairFilters(query: string, statusFilter: string) {
  return query.trim().length > 0 || statusFilter.length > 0;
}

export function buildAdminRepairStats(items: RepairItem[]) {
  return {
    total: items.length,
    waitingApproval: items.filter((item) => item.status === 'WAITING_APPROVAL').length,
    readyPickup: items.filter((item) => item.status === 'READY_PICKUP').length,
    completed: items.filter((item) => item.status === 'DELIVERED').length,
  };
}

export function filterAdminRepairItems(items: RepairItem[], query: string, statusFilter: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (!normalizedQuery) return true;
    return [
      repairCode(item.id),
      item.customerName,
      item.customerPhone ?? '',
      item.deviceBrand ?? '',
      item.deviceModel ?? '',
      item.issueLabel ?? '',
      repairStatusLabel(item.status),
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
  });

  return filtered.slice(0, 50);
}

export function getRepairReferencePrice(item: RepairItem) {
  return item.finalPrice ?? item.quotedPrice;
}

export function getRepairIssueLabel(item: RepairItem) {
  return item.issueLabel || 'Sin diagnostico registrado';
}

export function getRepairDeviceLabel(item: RepairItem) {
  return [item.deviceBrand, item.deviceModel].filter(Boolean).join(' ') || 'Equipo sin identificar';
}

export function getRepairCommercialStatusLabel(item: RepairItem) {
  if (item.finalPrice != null) return 'Presupuesto final confirmado';
  if (item.quotedPrice != null) return 'Con presupuesto cargado';
  return 'Sin presupuesto cargado';
}

export function getRepairOriginLabel(item: RepairItem) {
  return item.userId ? 'Cliente web' : 'Ingreso interno';
}
