import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { repairsApi } from './api';
import type { RepairItem } from './types';

export function RepairDetailPage() {
  const { id = '' } = useParams();
  const [item, setItem] = useState<RepairItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    repairsApi.myDetail(id)
      .then((res) => { if (active) setItem(res.item); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Error cargando reparación'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4">
          <Button variant="outline" asChild><Link to="/repairs">← Mis reparaciones</Link></Button>
        </div>
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">Cargando detalle...</div>
        ) : error || !item ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900 shadow-sm">{error || 'No encontrada'}</div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">Reparación</div>
                <div className="font-black text-zinc-900">{item.id}</div>
              </div>
              <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-bold text-sky-700">{item.status}</div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <div><span className="font-semibold text-zinc-800">Cliente:</span> {item.customerName}</div>
              <div><span className="font-semibold text-zinc-800">Teléfono:</span> {item.customerPhone || '—'}</div>
              <div><span className="font-semibold text-zinc-800">Marca:</span> {item.deviceBrand || '—'}</div>
              <div><span className="font-semibold text-zinc-800">Modelo:</span> {item.deviceModel || '—'}</div>
              <div className="sm:col-span-2"><span className="font-semibold text-zinc-800">Falla:</span> {item.issueLabel || '—'}</div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">Presupuesto</div>
                <div className="text-xl font-black text-zinc-900">{item.quotedPrice != null ? `$${item.quotedPrice.toLocaleString('es-AR')}` : '—'}</div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">Precio final</div>
                <div className="text-xl font-black text-zinc-900">{item.finalPrice != null ? `$${item.finalPrice.toLocaleString('es-AR')}` : '—'}</div>
              </div>
            </div>
            {item.notes ? <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">{item.notes}</div> : null}
          </div>
        )}
      </div>
    </div>
  );
}
