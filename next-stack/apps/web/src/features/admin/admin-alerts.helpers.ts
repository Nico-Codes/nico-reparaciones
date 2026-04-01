import type { AdminDashboardResponse } from './api';

export type AlertViewState = Record<string, boolean>;
export type AlertBadgeTone = 'info' | 'warning' | 'danger';

export function alertTargetTo(alertId: string) {
  if (alertId.includes('stock')) return '/admin/productos';
  if (alertId.includes('repair')) return '/admin/repairs';
  if (alertId.includes('order') || alertId.includes('flow')) return '/admin/orders';
  return '/admin';
}

export function severityTone(severity: 'low' | 'medium' | 'high'): AlertBadgeTone {
  if (severity === 'high') return 'danger';
  if (severity === 'medium') return 'warning';
  return 'info';
}

export function severityLabel(severity: 'low' | 'medium' | 'high') {
  if (severity === 'high') return 'Alta';
  if (severity === 'medium') return 'Media';
  return 'Baja';
}

export function alertTitleFriendly(alert: AdminDashboardResponse['alerts'][number]) {
  if (alert.id.includes('stock')) return 'Stock bajo';
  if (alert.id.includes('repair')) return 'Reparaciones pendientes';
  if (alert.id.includes('order') || alert.id.includes('flow')) return 'Pedidos pendientes';
  return alert.title;
}

export function alertDescription(alert: AdminDashboardResponse['alerts'][number]) {
  if (alert.id.includes('stock')) return 'Productos con stock menor o igual a 3 unidades.';
  if (alert.id.includes('repair')) return 'Revisa reparaciones demoradas o listas para retiro.';
  if (alert.id.includes('order') || alert.id.includes('flow')) return 'Pedidos pendientes, confirmados o preparando que requieren seguimiento.';
  return 'Revisa y resuelve este pendiente operativo.';
}

export function buildAlertStats(alerts: AdminDashboardResponse['alerts'], seen: AlertViewState) {
  const activeAlerts = alerts.filter((alert) => alert.value > 0);
  return {
    alerts: activeAlerts,
    unseenCount: activeAlerts.filter((alert) => !seen[alert.id]).length,
    highSeverityCount: activeAlerts.filter((alert) => alert.severity === 'high').length,
  };
}

export function resolveAdminAlertsLoadError(cause: unknown) {
  return cause instanceof Error ? cause.message : 'No se pudieron cargar las alertas.';
}
