import { Clock3, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { eventTypeLabel } from './admin-repair-detail.helpers';
import { formatDateTime } from './repair-ui';
import type { RepairItem, RepairTimelineEvent, RepairWhatsappDraft } from './types';

type SidebarProps = {
  item: RepairItem;
  code: string;
  statusLabel: string;
  timeline: RepairTimelineEvent[];
  whatsappDraft: RepairWhatsappDraft | null;
  whatsappLoading: boolean;
  whatsappError: string;
  whatsappOpening: boolean;
  onOpenManualWhatsapp: () => void;
};

export function AdminRepairDetailSidebar({
  item,
  code,
  statusLabel,
  timeline,
  whatsappDraft,
  whatsappLoading,
  whatsappError,
  whatsappOpening,
  onOpenManualWhatsapp,
}: SidebarProps) {
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

      <SectionCard
        title="WhatsApp cliente"
        description="Fallback manual asistido con mensaje vigente para el estado guardado actual."
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <StatusBadge label="Manual asistido" tone="accent" size="sm" />
            <StatusBadge
              label={whatsappDraft?.cloudStatus === 'configured' ? 'Cloud configurado' : 'Cloud no disponible'}
              tone={whatsappDraft?.cloudStatus === 'configured' ? 'success' : 'neutral'}
              size="sm"
            />
          </div>
        }
      >
        {whatsappLoading ? (
          <div className="repair-whatsapp-preview">
            <div className="repair-whatsapp-preview__label">Preparando mensaje</div>
            <div className="repair-whatsapp-preview__hint">Estamos armando el texto exacto para este estado.</div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="fact-list">
              <FactRow label="Telefono" value={whatsappDraft?.phone || 'No informado'} />
              <FactRow label="Normalizado" value={whatsappDraft?.normalizedPhone || 'No disponible'} />
              <FactRow label="Plantilla" value={whatsappDraft?.templateKey || 'Sin plantilla'} />
            </div>

            {whatsappError ? (
              <div className="ui-alert ui-alert--warning" data-reveal>
                <MessageCircle className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <span className="ui-alert__title">No pudimos preparar WhatsApp</span>
                  <div className="ui-alert__text">{whatsappError}</div>
                </div>
              </div>
            ) : null}

            {!whatsappDraft?.canSend && whatsappDraft?.reason ? (
              <div className="ui-alert ui-alert--warning" data-reveal>
                <MessageCircle className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <span className="ui-alert__title">Falta completar el telefono</span>
                  <div className="ui-alert__text">{whatsappDraft.reason}</div>
                </div>
              </div>
            ) : null}

            <div className="repair-whatsapp-preview">
              <div className="repair-whatsapp-preview__label">Mensaje listo para enviar</div>
              <pre className="repair-whatsapp-preview__body">
                {whatsappDraft?.message || 'Todavia no hay un mensaje disponible para este caso.'}
              </pre>
            </div>

            <Button
              type="button"
              onClick={onOpenManualWhatsapp}
              disabled={!whatsappDraft?.canSend || whatsappOpening || whatsappLoading}
              className="w-full"
            >
              {whatsappOpening ? 'Abriendo WhatsApp...' : 'Abrir WhatsApp'}
            </Button>
          </div>
        )}
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
