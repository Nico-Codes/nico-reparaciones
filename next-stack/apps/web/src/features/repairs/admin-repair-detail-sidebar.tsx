import { Clock3 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionCard } from '@/components/ui/section-card';
import { eventTypeLabel } from './admin-repair-detail.helpers';
import { formatDateTime } from './repair-ui';
import type { RepairItem, RepairTimelineEvent } from './types';

type SidebarProps = {
  item: RepairItem;
  code: string;
  statusLabel: string;
  timeline: RepairTimelineEvent[];
};

export function AdminRepairDetailSidebar({ item, code, statusLabel, timeline }: SidebarProps) {
  return (
    <aside className="account-stack account-sticky">
      <SectionCard title="Resumen del caso" description="Datos administrativos y comerciales relevantes para seguimiento.">
        <div className="fact-list">
          <FactRow label="Codigo" value={code} />
          <FactRow label="Cliente" value={item.customerName || 'Sin nombre'} />
          <FactRow label="Telefono" value={item.customerPhone || 'No informado'} />
          <FactRow label="Ingreso" value={formatDateTime(item.createdAt)} />
          <FactRow label="Ultima actualizacion" value={formatDateTime(item.updatedAt)} />
          <FactRow label="Estado" value={statusLabel} />
        </div>
      </SectionCard>

      <SectionCard title="Historial" description="Eventos registrados para revisar la trazabilidad del caso.">
        {timeline.length === 0 ? (
          <EmptyState
            icon={<Clock3 className="h-5 w-5" />}
            title="Todavia no hay eventos"
            description="El historial se completa automaticamente a medida que se registran cambios en la reparacion."
          />
        ) : (
          <div className="space-y-3">
            {timeline.map((event) => (
              <div key={event.id} className="detail-panel">
                <div className="detail-panel__label">{eventTypeLabel(event.eventType)}</div>
                <div className="detail-panel__value">{event.message || 'Sin detalle adicional.'}</div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{formatDateTime(event.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </aside>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact-row">
      <div className="fact-label">{label}</div>
      <div className="fact-value fact-value--text">{value}</div>
    </div>
  );
}
