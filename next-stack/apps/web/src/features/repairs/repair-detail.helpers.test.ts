import { describe, expect, it } from 'vitest';
import {
  buildRepairDetailDeviceLabel,
  buildRepairDetailStatusMeta,
  buildRepairDetailSummaryFacts,
  resolveRepairDetailAlertTone,
} from './repair-detail.helpers';

describe('repair-detail.helpers', () => {
  const item = {
    id: 'abc123',
    customerName: 'Nico',
    customerPhone: '123',
    deviceBrand: 'Apple',
    deviceModel: 'iPhone',
    issueLabel: 'Pantalla',
    status: 'READY_PICKUP',
    quotedPrice: 10,
    finalPrice: 12,
    notes: null,
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T11:00:00.000Z',
  } as never;

  it('arma la etiqueta del equipo', () => {
    expect(buildRepairDetailDeviceLabel(item)).toBe('Apple iPhone');
  });

  it('resuelve el tono de alerta por estado', () => {
    expect(resolveRepairDetailAlertTone('READY_PICKUP')).toBe('success');
    expect(resolveRepairDetailAlertTone('WAITING_APPROVAL')).toBe('warning');
  });

  it('arma el resumen del sidebar', () => {
    expect(buildRepairDetailSummaryFacts(item)).toHaveLength(6);
    expect(buildRepairDetailStatusMeta(item).code.length).toBeGreaterThan(2);
  });
});
