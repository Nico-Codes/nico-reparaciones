import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, ShieldCheck, Wrench } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { repairsApi } from './api';
import {
  formatDateTime,
  money,
  repairCode,
  repairProgressSteps,
  repairStatusLabel,
  repairStatusSummary,
  repairStatusTone,
} from './repair-ui';
import type { RepairItem } from './types';

export function RepairDetailPage() {
  const { id = '' } = useParams();
  const [item, setItem] = useState<RepairItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    repairsApi
      .myDetail(id)
      .then((res) => {
        if (active) setItem(res.item);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar la reparación.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <PageShell context="account">
        <PageHeader
          context="account"
          eyebrow="Servicio técnico"
          title="Cargando detalle"
          subtitle="Estamos preparando la información completa de la reparación."
          actions={<StatusBadge label="Cargando" tone="info" />}
        />
        <SectionCard>
          <LoadingBlock label="Cargando reparación" lines={5} />
        </SectionCard>
      </PageShell>
    );
  }

  if (error || !item) {
    return (
      <PageShell context="account">
        <PageHeader
          context="account"
          eyebrow="Servicio técnico"
          title="Reparación no disponible"
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
            title={error || 'Reparación no encontrada'}
            description="Volvé al listado para revisar otro caso o usá la consulta pública si necesitás validar un ingreso."
            actions={
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/repairs">Ver mis reparaciones</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/reparacion">Consulta pública</Link>
                </Button>
              </div>
            }
          />
        </SectionCard>
      </PageShell>
    );
  }

  const statusLabel = repairStatusLabel(item.status);
  const statusTone = repairStatusTone(item.status);
  const statusSummary = repairStatusSummary(item.status);
  const deviceLabel = [item.deviceBrand, item.deviceModel].filter(Boolean).join(' ') || 'Equipo sin identificar';

  return (
    <PageShell context="account">
      <PageHeader
        context="account"
        eyebrow={`Reparación ${repairCode(item.id)}`}
        title="Detalle del servicio"
        subtitle={statusSummary}
        actions={
          <>
            <StatusBadge label={statusLabel} tone={statusTone} />
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
            description="Resumen del momento actual del servicio y próximos pasos estimados."
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)]">
              <ProgressSteps items={repairProgressSteps(item.status)} />

              <div className="account-stack">
                <div className="summary-box">
                  <div className="summary-box__label">Equipo</div>
                  <div className="mt-2 text-[1.35rem] font-black tracking-tight text-zinc-950">{deviceLabel}</div>
                  <div className="summary-box__hint">{item.issueLabel || 'Falla pendiente de definición'}</div>
                </div>

                <div className={`ui-alert ${item.status === 'CANCELLED' ? 'ui-alert--danger' : item.status === 'READY_PICKUP' || item.status === 'DELIVERED' ? 'ui-alert--success' : item.status === 'WAITING_APPROVAL' ? 'ui-alert--warning' : 'ui-alert--info'}`}>
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
                  <div>
                    <span className="ui-alert__title">{statusLabel}</span>
                    <div className="ui-alert__text">{statusSummary}</div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Datos del caso"
            description="Información principal del equipo, cliente y presupuesto registrado."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="detail-stack">
                <div className="detail-panel">
                  <div className="detail-panel__label">Equipo</div>
                  <div className="detail-panel__value">{deviceLabel}</div>
                </div>
                <div className="detail-panel">
                  <div className="detail-panel__label">Falla reportada</div>
                  <div className="detail-panel__value">{item.issueLabel || 'Sin diagnóstico registrado'}</div>
                </div>
              </div>

              <div className="detail-stack">
                <div className="detail-panel">
                  <div className="detail-panel__label">Presupuesto</div>
                  <div className="detail-panel__value">{money(item.quotedPrice)}</div>
                </div>
                <div className="detail-panel">
                  <div className="detail-panel__label">Precio final</div>
                  <div className="detail-panel__value">{money(item.finalPrice)}</div>
                </div>
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
              <FactRow label="Código" value={repairCode(item.id)} />
              <FactRow label="Cliente" value={item.customerName} />
              <FactRow label="Teléfono" value={item.customerPhone || 'No informado'} />
              <FactRow label="Ingreso" value={formatDateTime(item.createdAt)} />
              <FactRow label="Última actualización" value={formatDateTime(item.updatedAt)} />
              <FactRow label="Estado" value={statusLabel} />
            </div>
          </SectionCard>

          <SectionCard tone="muted" title="Ayuda" description="Podés revisar el listado completo o consultar otra reparación manualmente.">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <Button asChild variant="outline" className="w-full justify-center">
                <Link to="/repairs">Ver mis reparaciones</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-center">
                <Link to="/reparacion">
                  <Wrench className="h-4 w-4" />
                  Consulta pública
                </Link>
              </Button>
            </div>
          </SectionCard>
        </aside>
      </div>
    </PageShell>
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
