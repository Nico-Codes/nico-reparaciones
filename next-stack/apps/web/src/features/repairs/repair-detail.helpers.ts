import {
  formatDateTime,
  money,
  repairCode,
  repairStatusLabel,
  repairStatusSummary,
  repairStatusTone,
} from './repair-ui';
import type { RepairItem } from './types';

export function resolveRepairDetailLoadError(cause: unknown) {
  return cause instanceof Error ? cause.message : 'No se pudo cargar la reparacion.';
}

export function buildRepairDetailDeviceLabel(item: RepairItem) {
  return [item.deviceBrand, item.deviceModel].filter(Boolean).join(' ') || 'Equipo sin identificar';
}

export function resolveRepairDetailAlertTone(status: string) {
  if (status === 'CANCELLED') return 'danger';
  if (status === 'READY_PICKUP' || status === 'DELIVERED') return 'success';
  if (status === 'WAITING_APPROVAL') return 'warning';
  return 'info';
}

export function buildRepairDetailSummaryFacts(item: RepairItem) {
  return [
    { label: 'Codigo', value: repairCode(item.id) },
    { label: 'Cliente', value: item.customerName },
    { label: 'Telefono', value: item.customerPhone || 'No informado' },
    { label: 'Ingreso', value: formatDateTime(item.createdAt) },
    { label: 'Ultima actualizacion', value: formatDateTime(item.updatedAt) },
    { label: 'Estado', value: repairStatusLabel(item.status) },
  ];
}

export function buildRepairDetailCaseFacts(item: RepairItem) {
  return [
    { label: 'Equipo', value: buildRepairDetailDeviceLabel(item) },
    { label: 'Falla reportada', value: item.issueLabel || 'Sin diagnostico registrado' },
    { label: 'Presupuesto', value: money(item.quotedPrice) },
    { label: 'Precio final', value: money(item.finalPrice) },
  ];
}

export function buildRepairDetailStatusMeta(item: RepairItem) {
  return {
    code: repairCode(item.id),
    statusLabel: repairStatusLabel(item.status),
    statusTone: repairStatusTone(item.status),
    statusSummary: repairStatusSummary(item.status),
  };
}
