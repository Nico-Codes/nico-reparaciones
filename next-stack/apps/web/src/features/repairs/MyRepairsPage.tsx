import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { repairsApi } from './api';
import type { RepairItem } from './types';

export function MyRepairsPage() {
  const [items, setItems] = useState<RepairItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    repairsApi
      .my()
      .then((res) => {
        if (active) setItems(res.items);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Error cargando reparaciones');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="store-shell" data-my-repairs-page>
      <section className="page-head store-hero">
        <div>
          <div className="page-title">Mis reparaciones</div>
          <p className="page-subtitle">Seguimiento de equipos, estados y presupuestos.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/">Inicio</Link>
        </Button>
      </section>

      {error ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

      {loading ? (
        <div className="card">
          <div className="card-body">Cargando reparaciones...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="text-sm text-zinc-700">Todavía no tenés reparaciones asociadas.</div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body space-y-3">
            {items.map((r) => (
              <Link key={r.id} to={`/repairs/${r.id}`} className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-black text-zinc-900">
                      {r.deviceBrand || 'Dispositivo'} {r.deviceModel || ''}
                    </div>
                    <div className="text-xs text-zinc-500">{r.issueLabel || 'Sin detalle de falla'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-zinc-600">{r.status}</div>
                    <div className="text-sm font-bold text-zinc-900">{new Date(r.createdAt).toLocaleDateString('es-AR')}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
