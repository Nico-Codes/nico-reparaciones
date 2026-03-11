import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { repairsApi } from './api';
import { formatDateTime, money, repairStatusSummary, repairStatusTone } from './repair-ui';
import type { PublicRepairQuoteApprovalItem } from './types';

export function PublicRepairQuoteApprovalPage() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') ?? '').trim();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<PublicRepairQuoteApprovalItem | null>(null);
  const [canDecide, setCanDecide] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!id.trim() || !token) {
        if (!active) return;
        setError('El enlace de aprobación es inválido o está incompleto.');
        setLoading(false);
        return;
      }

      try {
        const response = await repairsApi.publicQuoteApproval(id, token);
        if (!active) return;
        setItem(response.item);
        setCanDecide(response.canDecide);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : 'No pudimos abrir el enlace de aprobación.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [id, token]);

  async function onDecision(action: 'approve' | 'reject') {
    if (!id.trim() || !token || !canDecide || actionLoading) return;
    setActionLoading(action);
    setError(null);
    setMessage(null);
    try {
      const response =
        action === 'approve'
          ? await repairsApi.publicQuoteApprove(id, token)
          : await repairsApi.publicQuoteReject(id, token);
      setItem(response.item);
      setCanDecide(response.canDecide);
      setMessage(response.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos guardar tu decisión.');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <PageShell context="store" className="px-4 py-4 md:py-5">
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          context="store"
          eyebrow="Aprobación remota"
          title="Presupuesto de reparación"
          subtitle={`Revisá el detalle del caso ${id || '-'} y definí si querés continuar con el trabajo.`}
          actions={
            <Button asChild variant="outline" size="sm">
              <Link to="/reparacion">Volver a reparación</Link>
            </Button>
          }
        />

        {loading ? (
          <SectionCard title="Cargando presupuesto" description="Traemos la última versión del caso y el estado de aprobación.">
            <LoadingBlock label="Cargando presupuesto de reparación" lines={4} />
          </SectionCard>
        ) : null}

        {!loading && error ? (
          <EmptyState
            title="No pudimos abrir este enlace"
            description={error}
            actions={
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/reparacion">Consultar reparación</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/store">Volver a la tienda</Link>
                </Button>
              </div>
            }
          />
        ) : null}

        {!loading && !error && item ? (
          <>
            <SectionCard
              title="Detalle del caso"
              description={repairStatusSummary(item.status)}
              actions={<StatusBadge tone={repairStatusTone(item.status)} label={item.statusLabel} />}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Cliente" value={item.customerName} />
                <Info label="Teléfono" value={item.customerPhoneMasked ?? 'No informado'} />
                <Info label="Equipo" value={[item.deviceBrand, item.deviceModel].filter(Boolean).join(' ') || 'No informado'} />
                <Info label="Falla reportada" value={item.issueLabel || 'No informada'} />
                <Info label="Presupuesto" value={item.finalPrice != null ? money(item.finalPrice) : money(item.quotedPrice)} />
                <Info label="Última actualización" value={formatDateTime(item.updatedAt)} />
              </div>

              {item.notes ? (
                <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Detalle técnico</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm font-medium text-zinc-700">{item.notes}</div>
                </div>
              ) : null}
            </SectionCard>

            {message ? (
              <div className="ui-alert ui-alert--success">
                <div>
                  <span className="ui-alert__title">Decisión registrada</span>
                  <div className="ui-alert__text">{message}</div>
                </div>
              </div>
            ) : null}

            {canDecide ? (
              <SectionCard
                title="¿Cómo querés continuar?"
                description="Podés aprobar el presupuesto para avanzar con la reparación o rechazarlo si no querés seguir."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    onClick={() => void onDecision('approve')}
                    disabled={actionLoading !== null}
                    className="w-full justify-center"
                  >
                    {actionLoading === 'approve' ? 'Guardando...' : 'Aprobar presupuesto'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void onDecision('reject')}
                    disabled={actionLoading !== null}
                    className="w-full justify-center"
                  >
                    {actionLoading === 'reject' ? 'Guardando...' : 'Rechazar presupuesto'}
                  </Button>
                </div>
                <p className="text-sm text-zinc-500">
                  Si aprobás, el caso pasa a reparación. Si rechazás, lo cerramos sin avanzar con el trabajo.
                </p>
              </SectionCard>
            ) : (
              <SectionCard title="Estado de la aprobación" description="Este presupuesto ya no espera una nueva decisión desde este enlace.">
                <div className="ui-alert ui-alert--info">
                  <div>
                    <span className="ui-alert__title">Sin acciones pendientes</span>
                    <div className="ui-alert__text">La reparación ya fue aprobada, rechazada o cerrada por otra vía.</div>
                  </div>
                </div>
              </SectionCard>
            )}
          </>
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
