import { describe, expect, it } from 'vitest';
import { alertTargetTo, buildAlertStats, severityLabel, severityTone } from './admin-alerts.helpers';

describe('admin-alerts.helpers', () => {
  it('mapea destinos por tipo de alerta', () => {
    expect(alertTargetTo('stock-low')).toBe('/admin/productos');
    expect(alertTargetTo('repair-waiting')).toBe('/admin/repairs');
    expect(alertTargetTo('order-flow')).toBe('/admin/orders');
  });

  it('resuelve prioridad visual', () => {
    expect(severityTone('high')).toBe('danger');
    expect(severityLabel('medium')).toBe('Media');
  });

  it('calcula metricas filtrando alertas sin valor', () => {
    const stats = buildAlertStats(
      [
        { id: 'stock', value: 2, severity: 'high' },
        { id: 'noop', value: 0, severity: 'low' },
      ] as never,
      {},
    );
    expect(stats.alerts).toHaveLength(1);
    expect(stats.unseenCount).toBe(1);
    expect(stats.highSeverityCount).toBe(1);
  });
});
