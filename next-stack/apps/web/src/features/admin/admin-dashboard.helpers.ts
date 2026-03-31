import { normalizeOrderStatus } from '../orders/order-ui';
import type { AdminDashboardResponse } from './api';

export type DashboardBadgeTone = 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'danger';

export type DashboardSummary = {
  deliveredRevenue: number;
  ticketAverage: number;
  avgRepairValue: number;
  lowStockProducts: number;
  pendingApprovals: number;
  repairDiagnosis: number;
  repairReadyPickup: number;
  pendingFlowOrders: number;
  whatsappPending: number;
  orderStatusCounts: Record<(typeof ORDER_STATUS_KEYS)[number], number>;
  repairStatusCounts: Record<(typeof REPAIR_STATUS_KEYS)[number], number>;
};

export type DashboardWorkQueueItem = {
  id: string;
  title: string;
  description: string;
  value: number;
  to: string;
  tone: DashboardBadgeTone;
};

const ORDER_STATUS_KEYS = ['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'LISTO_RETIRO', 'ENTREGADO', 'CANCELADO'] as const;
const REPAIR_STATUS_KEYS = ['RECEIVED', 'DIAGNOSING', 'WAITING_APPROVAL', 'REPAIRING', 'READY_PICKUP', 'DELIVERED', 'CANCELLED'] as const;

export function formatDashboardGeneratedAt(value: string) {
  const date = new Date(value);
  return date.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
}

export function buildDashboardSummary(data: AdminDashboardResponse): DashboardSummary {
  const deliveredOrders = data.recent.orders.filter((order) => normalizeOrderStatus(order.status) === 'ENTREGADO');
  const deliveredRevenue = deliveredOrders.reduce((acc, order) => acc + order.total, 0);
  const ticketAverage = deliveredOrders.length ? deliveredRevenue / deliveredOrders.length : 0;
  const deliveredRepairs = data.recent.repairs.filter((repair) => repair.status === 'DELIVERED');
  const orderStatusCounts = Object.fromEntries(ORDER_STATUS_KEYS.map((status) => [status, 0])) as DashboardSummary['orderStatusCounts'];
  const repairStatusCounts = Object.fromEntries(REPAIR_STATUS_KEYS.map((status) => [status, 0])) as DashboardSummary['repairStatusCounts'];

  for (const order of data.recent.orders) {
    const key = normalizeOrderStatus(order.status) as keyof typeof orderStatusCounts;
    if (key in orderStatusCounts) orderStatusCounts[key] += 1;
  }

  for (const repair of data.recent.repairs) {
    const key = normalizeDashboardRepairStatus(repair.status) as keyof typeof repairStatusCounts;
    if (key in repairStatusCounts) repairStatusCounts[key] += 1;
  }

  return {
    deliveredRevenue,
    ticketAverage,
    avgRepairValue: deliveredRepairs.length
      ? deliveredRepairs.reduce((acc, repair) => acc + (repair.finalPrice ?? repair.quotedPrice ?? 0), 0) / deliveredRepairs.length
      : 0,
    lowStockProducts: data.metrics.products.lowStock,
    pendingApprovals: repairStatusCounts.WAITING_APPROVAL,
    repairDiagnosis: repairStatusCounts.DIAGNOSING,
    repairReadyPickup: repairStatusCounts.READY_PICKUP,
    pendingFlowOrders: data.metrics.orders.pendingFlow,
    whatsappPending: data.alerts.find((alert) => alert.id === 'pending-flow-orders')?.value ?? 0,
    orderStatusCounts,
    repairStatusCounts,
  };
}

export function buildDashboardWorkQueue(summary: DashboardSummary): DashboardWorkQueueItem[] {
  const items: DashboardWorkQueueItem[] = [
    {
      id: 'repair-diagnosis',
      title: 'Revisar ingresos en diagnostico',
      description: 'Casos recien ingresados que todavia no tienen presupuesto aprobado ni avance tecnico.',
      value: summary.repairDiagnosis,
      to: '/admin/repairs',
      tone: 'info',
    },
    {
      id: 'repair-approval',
      title: 'Pedir o seguir aprobaciones',
      description: 'Equipos esperando respuesta del cliente para avanzar o cerrar el trabajo.',
      value: summary.pendingApprovals,
      to: '/admin/repairs',
      tone: 'warning',
    },
    {
      id: 'repair-ready',
      title: 'Coordinar entregas del taller',
      description: 'Reparaciones listas para retiro y seguimiento inmediato con el cliente.',
      value: summary.repairReadyPickup,
      to: '/admin/repairs',
      tone: 'success',
    },
    {
      id: 'orders-pending',
      title: 'Destrabar pedidos activos',
      description: 'Pedidos pendientes o confirmados que requieren preparacion, retiro o comunicacion.',
      value: summary.pendingFlowOrders,
      to: '/admin/orders',
      tone: 'accent',
    },
    {
      id: 'stock-low',
      title: 'Reponer stock critico',
      description: 'Productos con stock bajo o agotado que conviene revisar antes de la proxima venta.',
      value: summary.lowStockProducts,
      to: '/admin/productos',
      tone: 'danger',
    },
  ];

  return items.sort((a, b) => b.value - a.value);
}

export function normalizeDashboardRepairStatus(status: string) {
  return status === 'IN_REPAIR' ? 'REPAIRING' : status;
}
