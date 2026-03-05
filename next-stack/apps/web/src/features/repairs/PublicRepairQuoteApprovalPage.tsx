import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { repairsApi } from './api';
import type { PublicRepairQuoteApprovalItem } from './types';

function money(v: number | null) {
  if (v == null) return 'A confirmar';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);
}

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
        setError('Enlace invalido o incompleto.');
        setLoading(false);
        return;
      }

      try {
        const res = await repairsApi.publicQuoteApproval(id, token);
        if (!active) return;
        setItem(res.item);
        setCanDecide(res.canDecide);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'No se pudo abrir el enlace.');
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
      const res =
        action === 'approve'
          ? await repairsApi.publicQuoteApprove(id, token)
          : await repairsApi.publicQuoteReject(id, token);
      setItem(res.item);
      setCanDecide(res.canDecide);
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la decision.');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="store-shell">
      <div className="mx-auto max-w-[920px] px-4 py-4 md:py-5">
        <section className="store-hero mb-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h1 className="text-xl font-black leading-tight tracking-tight text-zinc-900 md:text-[1.7rem]">
                Presupuesto de reparacion
              </h1>
              <p className="mt-1 text-sm text-zinc-700">Codigo {id || '-'}</p>
            </div>
            <Link to="/reparacion" className="btn-outline inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-bold">
              Volver a reparacion
            </Link>
          </div>
        </section>

        {loading ? (
          <section className="card">
            <div className="card-body text-sm font-medium text-zinc-700">Cargando presupuesto...</div>
          </section>
        ) : null}

        {!loading && error ? (
          <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</section>
        ) : null}

        {!loading && !error && item ? (
          <>
            <section className="card">
              <div className="card-head flex flex-wrap items-center justify-between gap-3">
                <div className="text-base font-black text-zinc-900">Detalle</div>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                  {item.statusLabel}
                </span>
              </div>
              <div className="card-body">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Cliente" value={item.customerName} />
                  <Info label="Telefono" value={item.customerPhoneMasked ?? 'No informado'} />
                  <Info label="Equipo" value={[item.deviceBrand, item.deviceModel].filter(Boolean).join(' ') || 'No informado'} />
                  <Info label="Falla" value={item.issueLabel || 'No informada'} />
                  <Info label="Presupuesto" value={item.finalPrice != null ? money(item.finalPrice) : money(item.quotedPrice)} />
                  <Info label="Actualizado" value={new Date(item.updatedAt).toLocaleString('es-AR')} />
                </div>

                {item.notes ? (
                  <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Detalle tecnico</div>
                    <div className="mt-1 whitespace-pre-wrap text-sm font-medium text-zinc-700">{item.notes}</div>
                  </div>
                ) : null}
              </div>
            </section>

            {message ? (
              <section className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {message}
              </section>
            ) : null}

            {canDecide ? (
              <section className="mt-4 card">
                <div className="card-body space-y-3">
                  <div className="text-base font-black text-zinc-900">Como queres continuar?</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => onDecision('approve')}
                      disabled={actionLoading !== null}
                      className="btn-primary h-11 w-full justify-center rounded-xl text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionLoading === 'approve' ? 'Guardando...' : 'Aprobar presupuesto'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecision('reject')}
                      disabled={actionLoading !== null}
                      className="btn-outline h-11 w-full justify-center rounded-xl text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionLoading === 'reject' ? 'Guardando...' : 'Rechazar presupuesto'}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Si aprobas, el estado pasa a "En reparacion". Si rechazas, la reparacion queda cancelada.
                  </p>
                </div>
              </section>
            ) : (
              <section className="mt-4 card">
                <div className="card-body text-sm font-semibold text-zinc-700">
                  Esta reparacion ya no esta esperando aprobacion.
                </div>
              </section>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2">
      <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-zinc-800">{value}</div>
    </div>
  );
}
