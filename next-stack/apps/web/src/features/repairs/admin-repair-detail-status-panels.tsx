import { ShieldCheck } from 'lucide-react';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { repairDetailStatusAlertTone } from './admin-repair-detail.helpers';
import { repairProgressSteps } from './repair-ui';

type AdminRepairDetailStatusSectionProps = {
  status: string;
  statusLabel: string;
  statusSummary: string;
  deviceLabel: string;
  issueLabel: string;
};

export function AdminRepairDetailStatusSection({
  status,
  statusLabel,
  statusSummary,
  deviceLabel,
  issueLabel,
}: AdminRepairDetailStatusSectionProps) {
  return (
    <SectionCard
      title="Estado y seguimiento"
      description="Visualiza el avance del caso y el proximo hito esperado para el cliente."
      actions={<StatusBadge label={statusLabel} tone={repairDetailStatusAlertTone(status)} size="sm" />}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
        <ProgressSteps items={repairProgressSteps(status)} />

        <div className="account-stack">
          <div className="summary-box">
            <div className="summary-box__label">Equipo</div>
            <div className="mt-2 text-[1.35rem] font-black tracking-tight text-zinc-950">{deviceLabel}</div>
            <div className="summary-box__hint">{issueLabel || 'Falla pendiente de definicion'}</div>
          </div>

          <div className={`ui-alert ui-alert--${repairDetailStatusAlertTone(status)}`}>
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <span className="ui-alert__title">{statusLabel}</span>
              <div className="ui-alert__text">{statusSummary}</div>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
