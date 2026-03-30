import { BadRequestException } from '@nestjs/common';
import { Prisma, type Repair } from '@prisma/client';

export const REPAIR_STATUS_TRANSITIONS: Record<Repair['status'], Repair['status'][]> = {
  RECEIVED: ['DIAGNOSING', 'WAITING_APPROVAL', 'REPAIRING', 'READY_PICKUP', 'CANCELLED'],
  DIAGNOSING: ['WAITING_APPROVAL', 'REPAIRING', 'READY_PICKUP', 'CANCELLED'],
  WAITING_APPROVAL: ['REPAIRING', 'CANCELLED'],
  REPAIRING: ['READY_PICKUP', 'CANCELLED'],
  READY_PICKUP: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function cleanNullable(value?: string | null) {
  const normalized = (value ?? '').trim();
  return normalized || null;
}

export function normalizeComparableText(value?: string | null) {
  return cleanNullable(value)?.toLowerCase() ?? null;
}

export function normalizePhone(value?: string | null) {
  return (value ?? '').replace(/\D+/g, '');
}

export function maskPhone(phone: string) {
  const digits = normalizePhone(phone);
  if (!digits) return null;
  if (digits.length <= 4) return digits;
  return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function sameMoney(current: Prisma.Decimal | null | undefined, next: number | null | undefined) {
  const left = current != null ? roundMoney(Number(current)) : null;
  const right = next != null ? roundMoney(next) : null;
  return left === right;
}

export function normalizeRepairStatus(status: string) {
  const normalized = status.trim().toUpperCase();
  const allowed = new Set<Repair['status']>([
    'RECEIVED',
    'DIAGNOSING',
    'WAITING_APPROVAL',
    'REPAIRING',
    'READY_PICKUP',
    'DELIVERED',
    'CANCELLED',
  ]);
  if (!allowed.has(normalized as Repair['status'])) return null;
  return normalized as Repair['status'];
}

export function assertValidRepairStatusTransition(current: Repair['status'], next: Repair['status']) {
  if (current === next) return;
  const allowed = REPAIR_STATUS_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new BadRequestException(`No se puede cambiar una reparacion de ${current} a ${next}`);
  }
}

export function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function buildCreatedAtRange(fromRaw?: string, toRaw?: string) {
  const from = parseDateStart(fromRaw);
  const toExclusive = parseDateEndExclusive(toRaw);
  if (!from && !toExclusive) return undefined;
  return {
    ...(from ? { gte: from } : {}),
    ...(toExclusive ? { lt: toExclusive } : {}),
  };
}

function parseDateStart(value?: string) {
  const normalized = (value ?? '').trim();
  if (!normalized) return null;
  const date = new Date(`${normalized}T00:00:00.000`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateEndExclusive(value?: string) {
  const normalized = (value ?? '').trim();
  if (!normalized) return null;
  const date = new Date(`${normalized}T00:00:00.000`);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + 1);
  return date;
}

export function detectChangedFields(before: Repair, after: Repair) {
  const changed: string[] = [];
  const baseFields: Array<[keyof Repair, string]> = [
    ['customerName', 'customerName'],
    ['customerPhone', 'customerPhone'],
    ['deviceTypeId', 'deviceTypeId'],
    ['deviceBrandId', 'deviceBrandId'],
    ['deviceModelId', 'deviceModelId'],
    ['deviceIssueTypeId', 'deviceIssueTypeId'],
    ['deviceBrand', 'deviceBrand'],
    ['deviceModel', 'deviceModel'],
    ['issueLabel', 'issueLabel'],
    ['status', 'status'],
    ['notes', 'notes'],
  ];

  for (const [field, label] of baseFields) {
    if (String(before[field] ?? '') !== String(after[field] ?? '')) {
      changed.push(label);
    }
  }

  const beforeQuoted = before.quotedPrice != null ? Number(before.quotedPrice) : null;
  const afterQuoted = after.quotedPrice != null ? Number(after.quotedPrice) : null;
  const beforeFinal = before.finalPrice != null ? Number(before.finalPrice) : null;
  const afterFinal = after.finalPrice != null ? Number(after.finalPrice) : null;

  if (beforeQuoted !== afterQuoted) changed.push('quotedPrice');
  if (beforeFinal !== afterFinal) changed.push('finalPrice');

  return changed;
}

export function repairStatusTemplateKey(status: Repair['status']) {
  if (status === 'RECEIVED') return 'received';
  if (status === 'DIAGNOSING') return 'diagnosing';
  if (status === 'WAITING_APPROVAL') return 'waiting_approval';
  if (status === 'REPAIRING') return 'repairing';
  if (status === 'READY_PICKUP') return 'ready_pickup';
  if (status === 'DELIVERED') return 'delivered';
  if (status === 'CANCELLED') return 'cancelled';
  return 'received';
}

export function repairStatusLabel(status: Repair['status']) {
  const map: Record<Repair['status'], string> = {
    RECEIVED: 'Recibido',
    DIAGNOSING: 'Diagnosticando',
    WAITING_APPROVAL: 'Esperando aprobacion',
    REPAIRING: 'En reparacion',
    READY_PICKUP: 'Listo para retirar',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
  };
  return map[status] ?? status;
}

export function defaultRepairWhatsappTemplate(statusKey: string) {
  const base = [
    'Hola {customer_name}',
    'Tu reparacion ({code}) esta en estado: *{status_label}*.',
    '',
    'Podes consultar el estado en: {lookup_url}',
    'Codigo: {code}',
    'Equipo: {device}',
    'NicoReparaciones',
  ];
  if (statusKey === 'waiting_approval') {
    base.splice(2, 0, 'Necesitamos tu aprobacion para continuar.', 'Aproba o rechaza aca: {approval_url}', '');
  }
  if (statusKey === 'ready_pickup') {
    base.splice(2, 0, 'Ya esta lista para retirar.', '', 'Direccion: {shop_address}', 'Horarios: {shop_hours}', '');
  }
  return base.join('\n');
}

export function applyTemplateVars(template: string, vars: Record<string, string>) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key) => vars[key] ?? '');
}

export function getRepairsWebBaseUrl() {
  return (((process.env.WEB_URL ?? '').trim() || 'http://localhost:5174')).replace(/\/+$/, '');
}

export function getRepairQuoteApprovalSecret() {
  const explicit = (process.env.REPAIR_QUOTE_APPROVAL_SECRET ?? '').trim();
  if (explicit) return explicit;
  const accessSecret = (process.env.JWT_ACCESS_SECRET ?? '').trim();
  if (accessSecret) return `${accessSecret}.repair-quote`;
  return 'dev-access-secret-change-me.repair-quote';
}

export function getRepairQuoteApprovalTtlSeconds() {
  const raw = Number.parseInt((process.env.REPAIR_QUOTE_APPROVAL_TTL_SECONDS ?? '').trim(), 10);
  if (Number.isFinite(raw) && raw > 0) return raw;
  return 60 * 60 * 24 * 7;
}
