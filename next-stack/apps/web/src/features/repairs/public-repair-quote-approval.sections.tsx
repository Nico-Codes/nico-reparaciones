import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import type { PublicRepairQuoteApprovalItem } from './types';
import {
  buildPublicRepairQuoteApprovalFacts,
  buildPublicRepairQuoteApprovalMeta,
} from './public-repair-quote-approval.helpers';

export function PublicRepairQuoteApprovalLoading() {
  return (
    <SectionCard title="Cargando presupuesto" description="Traemos la ultima version del caso y el estado de aprobacion.">
      <LoadingBlock label="Cargando presupuesto de reparacion" lines={4} />
    </SectionCard>
  );
}

export function PublicRepairQuoteApprovalError({ error }: { error: string }) {
  return (
    <EmptyState
      title="No pudimos abrir este enlace"
      description={error}
      actions={
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/reparacion">Consultar reparacion</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/store">Volver a la tienda</Link>
          </Button>
        </div>
      }
    />
  );
}

export function PublicRepairQuoteApprovalLayout({
  id,
  item,
  canDecide,
  message,
  actionLoading,
  onDecision,
}: {
  id: string;
  item: PublicRepairQuoteApprovalItem;
  canDecide: boolean;
  message: string | null;
  actionLoading: 'approve' | 'reject' | null;
  onDecision: (action: 'approve' | 'reject') => void;
}) {
  const meta = buildPublicRepairQuoteApprovalMeta(item);
  const facts = buildPublicRepairQuoteApprovalFacts(item);

  return (
    <>
      <SectionCard
        title="Detalle del caso"
        description={meta.description}
        actions={<StatusBadge tone={meta.tone} label={item.statusLabel} />}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {facts.map((fact) => (
            <Info key={fact.label} label={fact.label} value={fact.value} />
          ))}
        </div>

        {item.notes ? (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Detalle tecnico</div>
            <div className="mt-1 whitespace-pre-wrap text-sm font-medium text-zinc-700">{item.notes}</div>
          </div>
        ) : null}
      </SectionCard>

      {message ? (
        <div className="ui-alert ui-alert--success">
          <div>
            <span className="ui-alert__title">Decision registrada</span>
            <div className="ui-alert__text">{message}</div>
          </div>
        </div>
      ) : null}

      {canDecide ? (
        <SectionCard
          title="¿Como queres continuar?"
          description="Podes aprobar el presupuesto para avanzar con la reparacion o rechazarlo si no queres seguir."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Button type="button" onClick={() => onDecision('approve')} disabled={actionLoading !== null} className="w-full justify-center">
              {actionLoading === 'approve' ? 'Guardando...' : 'Aprobar presupuesto'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onDecision('reject')} disabled={actionLoading !== null} className="w-full justify-center">
              {actionLoading === 'reject' ? 'Guardando...' : 'Rechazar presupuesto'}
            </Button>
          </div>
          <p className="text-sm text-zinc-500">
            Si aprobas, el caso pasa a reparacion. Si rechazas, lo cerramos sin avanzar con el trabajo.
          </p>
        </SectionCard>
      ) : (
        <SectionCard title="Estado de la aprobacion" description="Este presupuesto ya no espera una nueva decision desde este enlace.">
          <div className="ui-alert ui-alert--info">
            <div>
              <span className="ui-alert__title">Sin acciones pendientes</span>
              <div className="ui-alert__text">La reparacion ya fue aprobada, rechazada o cerrada por otra via.</div>
            </div>
          </div>
        </SectionCard>
      )}
    </>
  );
}

export function PublicRepairQuoteApprovalPageShell({
  id,
  loading,
  error,
  item,
  canDecide,
  message,
  actionLoading,
  onDecision,
}: {
  id: string;
  loading: boolean;
  error: string | null;
  item: PublicRepairQuoteApprovalItem | null;
  canDecide: boolean;
  message: string | null;
  actionLoading: 'approve' | 'reject' | null;
  onDecision: (action: 'approve' | 'reject') => void;
}) {
  return (
    <PageShell context="store" className="px-4 py-4 md:py-5">
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          context="store"
          eyebrow="Aprobacion remota"
          title="Presupuesto de reparacion"
          subtitle={`Revisa el detalle del caso ${id || '-'} y defini si queres continuar con el trabajo.`}
          actions={
            <Button asChild variant="outline" size="sm">
              <Link to="/reparacion">Volver a reparacion</Link>
            </Button>
          }
        />

        {loading ? <PublicRepairQuoteApprovalLoading /> : null}
        {!loading && error ? <PublicRepairQuoteApprovalError error={error} /> : null}
        {!loading && !error && item ? (
          <PublicRepairQuoteApprovalLayout
            id={id}
            item={item}
            canDecide={canDecide}
            message={message}
            actionLoading={actionLoading}
            onDecision={onDecision}
          />
        ) : null}
      </div>
    </PageShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5">
      <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-zinc-800">{value}</div>
    </div>
  );
}
