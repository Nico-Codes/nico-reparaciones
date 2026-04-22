import type { ProgressStepItem } from '@/components/ui/progress-steps';

export type UiTone = 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'danger';

const STATUS_ALIASES: Record<string, string> = {
  PENDING: 'PENDIENTE',
  CONFIRMED: 'CONFIRMADO',
  PREPARING: 'PREPARANDO',
  READY_PICKUP: 'LISTO_RETIRO',
  DELIVERED: 'ENTREGADO',
  CANCELLED: 'CANCELADO',
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  PREPARANDO: 'Preparando',
  LISTO_RETIRO: 'Listo para retirar',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO: 'Pago en el local',
  TRANSFERENCIA: 'Transferencia',
};

export function normalizeOrderStatus(status: string) {
  return STATUS_ALIASES[status] ?? status;
}

export function orderStatusLabel(status: string) {
  const normalized = normalizeOrderStatus(status);
  return ORDER_STATUS_LABELS[normalized] ?? normalized;
}

export function orderStatusTone(status: string): UiTone {
  switch (normalizeOrderStatus(status)) {
    case 'PENDIENTE':
      return 'warning';
    case 'CONFIRMADO':
      return 'info';
    case 'PREPARANDO':
      return 'accent';
    case 'LISTO_RETIRO':
      return 'success';
    case 'CANCELADO':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function orderStatusSummary(status: string) {
  switch (normalizeOrderStatus(status)) {
    case 'PENDIENTE':
      return 'Recibimos tu compra y estamos validando stock y disponibilidad para confirmarla.';
    case 'CONFIRMADO':
      return 'Tu pedido ya fue confirmado y pasará a preparación para el retiro.';
    case 'PREPARANDO':
      return 'Estamos armando el pedido para que puedas retirarlo con todo listo.';
    case 'LISTO_RETIRO':
      return 'El pedido está listo para retirar en el local durante el horario habitual.';
    case 'ENTREGADO':
      return 'La compra fue entregada y el pedido ya quedó cerrado.';
    case 'CANCELADO':
      return 'El pedido se cerró sin entrega. Si necesitás ayuda, contactanos desde la cuenta.';
    default:
      return 'Seguimiento disponible desde tu cuenta.';
  }
}

export function orderProgressSteps(status: string): ProgressStepItem[] {
  const normalized = normalizeOrderStatus(status);

  if (normalized === 'CANCELADO') {
    return [
      {
        key: 'received',
        label: 'Pedido recibido',
        description: 'Registramos la compra y generamos el pedido.',
        state: 'done',
      },
      {
        key: 'cancelled',
        label: 'Pedido cancelado',
        description: 'La operación se cerró sin entrega. Si hace falta, podés volver a comprar desde la tienda.',
        state: 'danger',
      },
    ];
  }

  const currentIndex = ['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'LISTO_RETIRO', 'ENTREGADO'].indexOf(normalized);

  const base: Array<Omit<ProgressStepItem, 'state'>> = [
    {
      key: 'received',
      label: 'Pedido recibido',
      description: 'Registramos la compra y validamos el stock disponible.',
    },
    {
      key: 'confirmed',
      label: 'Confirmación',
      description: 'El equipo del local confirma que el pedido puede avanzar.',
    },
    {
      key: 'preparing',
      label: 'Preparación',
      description: 'Se reúnen los productos y se deja listo el retiro.',
    },
    {
      key: 'pickup',
      label: 'Retiro',
      description: 'Te avisamos cuando ya podés pasar por el local.',
    },
    {
      key: 'done',
      label: 'Entrega cerrada',
      description: 'El pedido se retira y la operación queda finalizada.',
    },
  ];

  return base.map((step, index) => ({
    ...step,
    state:
      index < currentIndex
        ? 'done'
        : index === currentIndex
          ? normalized === 'ENTREGADO'
            ? 'done'
            : 'current'
          : 'upcoming',
  }));
}

export function orderCode(id: string) {
  return `#${id.slice(0, 8)}`;
}

export function paymentMethodLabel(method: string | null | undefined) {
  if (!method) return 'A definir';
  return PAYMENT_LABELS[method.trim().toUpperCase()] ?? 'A definir';
}

export function money(value: number) {
  return `$ ${value.toLocaleString('es-AR')}`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  return `${date.toLocaleDateString('es-AR')} ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
}
