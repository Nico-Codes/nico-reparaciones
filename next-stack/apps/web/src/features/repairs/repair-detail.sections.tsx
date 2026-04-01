import { AlertTriangle, ArrowLeft, ShieldCheck, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { repairProgressSteps } from './repair-ui';
import type { RepairItem } from './types';
import {
  buildRepairDetailCaseFacts,
  buildRepairDetailDeviceLabel,
  buildRepairDetailStatusMeta,
  buildRepairDetailSummaryFacts,
  resolveRepairDetailAlertTone,
} from './repair-detail.helpers';

export function RepairDetailLoading() {
  return (
    <PageShell context="account">
      <PageHeader
        context="account"
        eyebrow="Servicio tecnico"
        title="Cargando detalle"
        subtitle="Estamos preparando la informacion completa de la reparacion."
        actions={<StatusBadge label="Cargando" tone="info" />}
      />
      <SectionCard>
        <LoadingBlock label="Cargando reparacion" lines={5} />
      </SectionCard>
    </PageShell>
  );
}

export function RepairDetailEmpty({ error }: { error: string }) {
  return (
    <PageShell context="account">
      <PageHeader
        context="account"
        eyebrow="Servicio tecnico"
        title="Reparacion no disponible"
        subtitle="No pudimos recuperar el detalle solicitado."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/repairs">
              <ArrowLeft className="h-4 w-4" />
              Mis reparaciones
            </Link>
          </Button>
        }
      />
      <SectionCard>
        <EmptyState
          icon={<AlertTriangle className="h-5 w-5" />}
          title={error || 'Reparacion no encontrada'}
          description="Volve al listado para revisar otro caso o usa la consulta publica si necesitas validar un ingreso."
          actions={
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/repairs">Ver mis reparaciones</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/reparacion">Consulta publica</Link>
              </Button>
            </div>
          }
        />
      </SectionCard>
    </PageShell>
  );
}

export function RepairDetailLayout({ item }: { item: RepairItem }) {
  const deviceLabel = buildRepairDetailDeviceLabel(item);
  const status = buildRepairDetailStatusMeta(item);
  const caseFacts = buildRepairDetailCaseFacts(item);
  const summaryFacts = buildRepairDetailSummaryFacts(item);

  return (
    <PageShell context="account">
      <PageHeader
        context="account"
        eyebrow={`Reparacion ${status.code}`}
        title="Detalle del servicio"
        subtitle={status.statusSummary}
        actions={
          <>
            <StatusBadge label={status.statusLabel} tone={status.statusTone} />
            <Button asChild variant="outline" size="sm">
              <Link to="/repairs">
                <ArrowLeft className="h-4 w-4" />
                Mis reparaciones
              </Link>
            </Button>
          </>
        }
      />

      <div className="account-layout">
        <div className="account-stack">
          <SectionCard
            title="Estado y seguimiento"
            description="Resumen del momento actual del servicio y proximos pasos estimados."
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)]">
              <ProgressSteps items={repairProgressSteps(item.status)} />

              <div className="account-stack">
                <div className="summary-box">
                  <div className="summary-box__label">Equipo</div>
                  <div className="mt-2 text-[1.35rem] font-black tracking-tight text-zinc-950">{deviceLabel}</div>
                  <div className="summary-box__hint">{item.issueLabel || 'Falla pendiente de definicion'}</div>
                </div>

                <div className={`ui-alert ui-alert--${resolveRepairDetailAlertTone(item.status)}`}>
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
                  <div>
                    <span className="ui-alert__title">{status.statusLabel}</span>
                    <div className="ui-alert__text">{status.statusSummary}</div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Datos del caso"
            description="Informacion principal del equipo, cliente y presupuesto registrado."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="detail-stack">
                {caseFacts.slice(0, 2).map((fact) => (
                  <DetailPanel key={fact.label} label={fact.label} value={fact.value} />
                ))}
              </div>
              <div className="detail-stack">
                {caseFacts.slice(2).map((fact) => (
                  <DetailPanel key={fact.label} label={fact.label} value={fact.value} />
                ))}
              </div>
            </div>

            {item.notes ? (
              <div className="detail-panel mt-4">
                <div className="detail-panel__label">Observaciones</div>
                <div className="detail-panel__value whitespace-pre-line leading-relaxed">{item.notes}</div>
              </div>
            ) : null}
          </SectionCard>
        </div>

        <aside className="account-stack account-sticky">
          <SectionCard title="Resumen" description="Datos administrativos y fechas importantes del caso.">
            <div className="fact-list">
              {summaryFacts.map((fact) => (
                <FactRow key={fact.label} label={fact.label} value={fact.value} />
              ))}
            </div>
          </SectionCard>

          <SectionCard tone="muted" title="Ayuda" description="Podes revisar el listado completo o consultar otra reparacion manualmente.">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <Button asChild variant="outline" className="w-full justify-center">
                <Link to="/repairs">Ver mis reparaciones</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-center">
                <Link to="/reparacion">
                  <Wrench className="h-4 w-4" />
                  Consulta publica
                </Link>
              </Button>
            </div>
          </SectionCard>
        </aside>
      </div>
    </PageShell>
  );
}

function DetailPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-panel">
      <div className="detail-panel__label">{label}</div>
      <div className="detail-panel__value">{value}</div>
    </div>
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
