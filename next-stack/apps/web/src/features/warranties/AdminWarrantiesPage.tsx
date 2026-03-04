import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, type AdminWarrantyItem } from '@/features/admin/api';

function money(n: number) {
  return `$ ${n.toLocaleString('es-AR')}`;
}

export function AdminWarrantiesPage() {
  const [items, setItems] = useState<AdminWarrantyItem[]>([]);
  const [summary, setSummary] = useState({
    totalCount: 0,
    openCount: 0,
    closedCount: 0,
    totalLoss: 0,
  });
  const [supplierStats, setSupplierStats] = useState<
    Array<{ supplierId: string; name: string; incidentsCount: number; totalLoss: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [q, setQ] = useState('');
  const [sourceType, setSourceType] = useState<'' | 'repair' | 'product'>('');
  const [status, setStatus] = useState<'' | 'open' | 'closed'>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await adminApi.warranties({
          q: q.trim() || undefined,
          sourceType: sourceType || undefined,
          status: status || undefined,
          from: from || undefined,
          to: to || undefined,
        });
        if (!mounted) return;
        setItems(res.items);
        setSummary(res.summary);
        setSupplierStats(res.supplierStats);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Error cargando incidentes');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [refreshTick]);

  const topProviderEntry = useMemo(() => supplierStats[0] ?? null, [supplierStats]);

  async function closeIncident(id: string) {
    setError('');
    setMessage('');
    try {
      await adminApi.closeWarranty(id);
      setMessage('Incidente cerrado.');
      setRefreshTick((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cerrar el incidente');
    }
  }

  function clearFilters() {
    setQ('');
    setSourceType('');
    setStatus('');
    setFrom('');
    setTo('');
    setRefreshTick((v) => v + 1);
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Garantías y pérdidas</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Registro de costos por garantías en reparaciones y productos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Panel
            </Link>
            <Link to="/admin/garantias/crear" className="btn-primary !h-10 !rounded-xl px-5 text-sm font-bold">
              + Nuevo incidente
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="TOTAL INCIDENTES" value={String(summary.totalCount)} />
        <StatCard title="ABIERTOS" value={String(summary.openCount)} valueClass="text-amber-600" />
        <StatCard title="CERRADOS" value={String(summary.closedCount)} />
        <StatCard title="PÉRDIDA ACUMULADA" value={money(summary.totalLoss)} valueClass="text-rose-700" />
      </div>

      <section className="card">
        <div className="card-head">
          <div className="text-xl font-black tracking-tight text-zinc-900">Proveedores con más pérdida</div>
          <p className="mt-1 text-sm text-zinc-500">
            Top por monto acumulado en incidentes de garantía.
          </p>
        </div>
        <div className="card-body">
          {topProviderEntry ? (
            <div className="max-w-[260px] rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-3xl font-black tracking-tight text-zinc-900">{topProviderEntry.name}</div>
              <div className="mt-1 text-sm text-zinc-600">
                Incidentes: {topProviderEntry.incidentsCount}
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight text-rose-700">
                {money(topProviderEntry.totalLoss)}
              </div>
            </div>
          ) : (
            <div className="text-sm text-zinc-600">Sin incidentes.</div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-body">
          <div className="grid gap-3 xl:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr_0.7fr_auto]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar título, motivo o nota..."
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            />
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as '' | 'repair' | 'product')}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            >
              <option value="">Origen: Todos</option>
              <option value="repair">Reparación</option>
              <option value="product">Producto</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as '' | 'open' | 'closed')}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            >
              <option value="">Estado: Todos</option>
              <option value="open">Abierto</option>
              <option value="closed">Cerrado</option>
            </select>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              type="date"
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            />
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              type="date"
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRefreshTick((v) => v + 1)}
                className="btn-outline !h-11 !rounded-xl px-4 text-sm font-bold"
              >
                Filtrar
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="btn-ghost !h-11 !rounded-xl px-4 text-sm font-bold"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_8px_30px_-18px_#0f172a47]">
        <div className="hidden grid-cols-[0.8fr_0.8fr_2fr_0.9fr_0.8fr_0.8fr_0.8fr_0.7fr_0.8fr_0.8fr] gap-3 bg-zinc-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500 xl:grid">
          <div>FECHA</div>
          <div>ORIGEN</div>
          <div>DETALLE</div>
          <div>PROVEEDOR</div>
          <div>ORIGEN COSTO</div>
          <div className="text-right">COSTO</div>
          <div className="text-right">RECUPERADO</div>
          <div className="text-right">PÉRDIDA</div>
          <div>ESTADO</div>
          <div className="text-right">ACCIÓN</div>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-sm text-zinc-600">Cargando incidentes...</div>
        ) : (
          items.map((i, idx) => (
            <div key={i.id} className={`${idx ? 'border-t border-zinc-100' : ''} px-3 py-3`}>
              <div className="grid gap-3 xl:grid-cols-[0.8fr_0.8fr_2fr_0.9fr_0.8fr_0.8fr_0.8fr_0.7fr_0.8fr_0.8fr] xl:items-center">
                <div className="text-sm font-bold text-zinc-900">
                  <div>{i.date}</div>
                  <div>{i.time}</div>
                </div>
                <div>
                  <span className="inline-flex h-8 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold text-zinc-800">
                    {i.source}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-zinc-900">{i.title}</div>
                  {i.sourceType === 'repair' ? (
                    <div className="truncate text-sm text-zinc-600">
                      Reparación: {i.repairCode ?? '-'}{i.customerName ? ` - ${i.customerName}` : ''}
                    </div>
                  ) : (
                    <div className="truncate text-sm text-zinc-600">
                      Producto: {i.productName || '-'}
                    </div>
                  )}
                  <div className="truncate text-sm text-zinc-600">{i.reason || '-'}</div>
                </div>
                <div className="text-sm font-bold text-zinc-900">{i.provider}</div>
                <div>
                  <span className="inline-flex h-8 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold text-zinc-800">
                    {i.costSource}
                  </span>
                </div>
                <div className="text-right text-sm font-black text-zinc-900">{money(i.cost)}</div>
                <div className="text-right text-sm font-black text-emerald-700">{money(i.recovered)}</div>
                <div className="text-right text-sm font-black text-rose-700">{money(i.loss)}</div>
                <div>
                  <span
                    className={`inline-flex h-8 items-center rounded-full border px-3 text-sm font-bold ${
                      i.status === 'closed'
                        ? 'border-zinc-200 bg-zinc-100 text-zinc-700'
                        : 'border-amber-300 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {i.statusLabel}
                  </span>
                </div>
                <div className="text-right">
                  {i.status === 'open' ? (
                    <button
                      type="button"
                      onClick={() => void closeIncident(i.id)}
                      className="btn-outline !h-8 !rounded-xl px-3 text-sm font-bold"
                    >
                      Cerrar
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-500">Sin acción</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {!loading && !items.length ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-600">Sin incidentes para mostrar.</div>
        ) : null}
      </section>
    </div>
  );
}

function StatCard(props: { title: string; value: string; valueClass?: string }) {
  return (
    <section className="card">
      <div className="card-body">
        <div className="text-sm font-black uppercase tracking-wide text-zinc-500">{props.title}</div>
        <div className={`mt-2 text-5xl font-black tracking-tight ${props.valueClass ?? 'text-zinc-900'}`}>
          {props.value}
        </div>
      </div>
    </section>
  );
}
