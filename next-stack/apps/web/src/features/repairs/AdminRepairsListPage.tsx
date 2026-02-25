import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { repairsApi } from './api';
import type { RepairItem } from './types';

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Recibido',
  DIAGNOSING: 'Diagnosticando',
  WAITING_APPROVAL: 'Esperando aprobación',
  REPAIRING: 'En reparación',
  READY_PICKUP: 'Listo para retirar',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  RECEIVED: 'badge-sky',
  DIAGNOSING: 'badge-indigo',
  WAITING_APPROVAL: 'badge-amber',
  REPAIRING: 'badge-indigo',
  READY_PICKUP: 'badge-emerald',
  DELIVERED: 'badge-zinc',
  CANCELLED: 'badge-rose',
};

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function statusBadgeClass(status: string) {
  return STATUS_BADGE_CLASS[status] ?? 'badge-zinc';
}

function repairCode(id: string) {
  return `R-${id.slice(0, 13)}`;
}

function timeAgo(dateIso: string) {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 60) return `hace ${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} día${days === 1 ? '' : 's'}`;
  const weeks = Math.floor(days / 7);
  return `hace ${weeks} semana${weeks === 1 ? '' : 's'}`;
}

export function AdminRepairsListPage() {
  const [items, setItems] = useState<RepairItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await repairsApi.adminList();
        if (!mounted) return;
        setItems(res.items);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Error cargando reparaciones');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleItems = useMemo(() => items.slice(0, 50), [items]);

  return (
    <div className="store-shell">
      {error ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_8px_30px_-18px_#0f172a47]">
        <div className="hidden grid-cols-[1.55fr_0.95fr_0.9fr_0.85fr_0.75fr_1.7fr] gap-4 bg-zinc-50 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-zinc-500 lg:grid">
          <div>CODIGO</div>
          <div>CLIENTE</div>
          <div>EQUIPO</div>
          <div>ESTADO</div>
          <div>FINAL</div>
          <div className="text-right">ACCIONES</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-zinc-600">Cargando reparaciones...</div>
        ) : visibleItems.length === 0 ? (
          <div className="p-4 text-sm text-zinc-600">No hay reparaciones.</div>
        ) : (
          <div>
            {visibleItems.map((r, idx) => (
              <div key={r.id} className={`${idx > 0 ? 'border-t border-zinc-100' : ''} px-4 py-2.5`}>
                <div className="grid gap-3 lg:grid-cols-[1.55fr_0.95fr_0.9fr_0.85fr_0.75fr_1.7fr] lg:items-center">
                  <div className="min-w-0">
                    <div className="text-[15px] font-black leading-tight tracking-tight text-zinc-900">{repairCode(r.id)}</div>
                    <div className="mt-0.5 text-xs leading-tight text-zinc-600">
                      Recibido: {new Date(r.createdAt).toLocaleDateString('es-AR')} {new Date(r.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} ·{' '}
                      <span className="font-bold text-zinc-800">{timeAgo(r.createdAt)}</span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-black leading-tight tracking-tight text-zinc-900">{r.customerName}</div>
                    <div className="truncate text-xs text-zinc-600">{r.customerPhone || 'Sin teléfono'}</div>
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-[15px] leading-tight text-zinc-900">{[r.deviceBrand, r.deviceModel].filter(Boolean).join(' ') || 'Sin equipo'}</div>
                  </div>

                  <div>
                    <span className={statusBadgeClass(r.status)}>{statusLabel(r.status)}</span>
                  </div>

                  <div className="text-[15px] font-black tracking-tight text-zinc-900">
                    {r.finalPrice != null ? `$ ${r.finalPrice.toLocaleString('es-AR')}` : r.quotedPrice != null ? `$ ${r.quotedPrice.toLocaleString('es-AR')}` : '—'}
                  </div>

                  <div className="flex flex-nowrap items-center justify-start gap-2 lg:justify-end">
                    <Link to={`/admin/repairs/${encodeURIComponent(r.id)}`} className="inline-flex h-8 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-900 shadow-sm hover:bg-zinc-50">
                      Ver
                    </Link>
                    <button type="button" className="inline-flex h-8 items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-700 hover:bg-emerald-50">
                      WhatsApp
                    </button>
                    <button type="button" className="inline-flex h-8 items-center justify-center px-1 text-sm font-bold text-zinc-900 hover:text-zinc-700">
                      Mas
                    </button>
                    <span className="inline-flex h-8 items-center whitespace-nowrap rounded-full border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-700">
                      WA pendiente
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
