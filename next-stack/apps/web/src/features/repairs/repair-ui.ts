import type { ProgressStepItem } from '@/components/ui/progress-steps';
import type { UiTone } from '@/features/orders/order-ui';

export const REPAIR_STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Recibido',
  DIAGNOSING: 'Diagnosticando',
  WAITING_APPROVAL: 'Esperando aprobación',
  REPAIRING: 'En reparación',
  READY_PICKUP: 'Listo para retirar',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export function repairStatusLabel(status: string) {
  return REPAIR_STATUS_LABELS[status] ?? status;
}

export function repairStatusTone(status: string): UiTone {
  switch (status) {
    case 'RECEIVED':
      return 'info';
    case 'DIAGNOSING':
    case 'REPAIRING':
      return 'accent';
    case 'WAITING_APPROVAL':
      return 'warning';
    case 'READY_PICKUP':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function repairStatusSummary(status: string) {
  switch (status) {
    case 'RECEIVED':
      return 'Recibimos el equipo y quedó ingresado para revisión.';
    case 'DIAGNOSING':
      return 'Estamos revisando el equipo para confirmar diagnóstico y presupuesto.';
    case 'WAITING_APPROVAL':
      return 'Hay un presupuesto pendiente de tu aprobación para continuar.';
    case 'REPAIRING':
      return 'El equipo está en reparación y seguimos trabajando sobre el caso.';
    case 'READY_PICKUP':
      return 'La reparación quedó lista para retirar en el local.';
    case 'DELIVERED':
      return 'El trabajo fue entregado y el caso quedó cerrado.';
    case 'CANCELLED':
      return 'La reparación se canceló y el caso quedó cerrado sin entrega.';
    default:
      return 'Seguimiento disponible desde tu cuenta.';
  }
}

export function repairProgressSteps(status: string): ProgressStepItem[] {
  if (status === 'CANCELLED') {
    return [
      {
        key: 'received',
        label: 'Equipo recibido',
        description: 'Ingresamos el equipo y abrimos el caso.',
        state: 'done',
      },
      {
        key: 'cancelled',
        label: 'Caso cancelado',
        description: 'El servicio se cerró sin completar la reparación.',
        state: 'danger',
      },
    ];
  }

  const currentIndex = ['RECEIVED', 'DIAGNOSING', 'WAITING_APPROVAL', 'REPAIRING', 'READY_PICKUP', 'DELIVERED'].indexOf(status);

  const base: Array<Omit<ProgressStepItem, 'state'>> = [
    {
      key: 'received',
      label: 'Equipo recibido',
      description: 'Registramos el ingreso del equipo y los datos del caso.',
    },
    {
      key: 'diagnosis',
      label: 'Diagnóstico',
      description: 'Revisamos la falla y estimamos el alcance del trabajo.',
    },
    {
      key: 'approval',
      label: 'Aprobación',
      description: 'Si corresponde, te compartimos el presupuesto para avanzar.',
    },
    {
      key: 'repair',
      label: 'Reparación',
      description: 'Trabajamos sobre el equipo y registramos el avance.',
    },
    {
      key: 'pickup',
      label: 'Retiro',
      description: 'Cuando esté listo, podés coordinar el retiro en el local.',
    },
    {
      key: 'done',
      label: 'Caso cerrado',
      description: 'La reparación queda entregada y finalizada.',
    },
  ];

  return base.map((step, index) => ({
    ...step,
    state:
      index < currentIndex
        ? 'done'
        : index === currentIndex
          ? status === 'DELIVERED'
            ? 'done'
            : 'current'
          : 'upcoming',
  }));
}

export function repairCode(id: string) {
  return `R-${id.slice(0, 13)}`;
}

export function money(value: number | null, fallback = 'Sin definir') {
  return value != null ? `$ ${value.toLocaleString('es-AR')}` : fallback;
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  return `${date.toLocaleDateString('es-AR')} ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
}
