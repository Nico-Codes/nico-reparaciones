import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import { adminApi, type AdminAccountingItem } from '@/features/admin/api';

function money(n: number) {
  return `$ ${n.toLocaleString('es-AR')}`;
}

const directionOptions = [
  { value: '', label: 'Dirección: Todas' },
  { value: 'inflow', label: 'Ingreso' },
  { value: 'outflow', label: 'Egreso' },
];

export function AdminAccountingPage() {
  const [rows, setRows] = useState<AdminAccountingItem[]>([]);
  const [categories, setCategories] = useState<
    Array<{ category: string; entriesCount: number; inflowTotal: number; outflowTotal: number; netTotal: number }>
  >([]);
  const [summary, setSummary] = useState({
    entriesCount: 0,
    inflowTotal: 0,
    outflowTotal: 0,
    netTotal: 0,
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [direction, setDirection] = useState<'' | 'inflow' | 'outflow'>('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await adminApi.accounting({
          q: q.trim() || undefined,
          direction: direction || undefined,
          category: category || undefined,
          from: from || undefined,
          to: to || undefined,
        });
        if (!mounted) return;
        setRows(res.items);
        setCategories(res.categorySummary);
        setSummary(res.summary);
        setAvailableCategories(res.categories);
        if (!from) setFrom(res.filters.from);
        if (!to) setTo(res.filters.to);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Error cargando contabilidad');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [refreshTick]);

  const categoryOptions = useMemo(
    () => [{ value: '', label: 'Categoría: Todas' }, ...availableCategories.map((item) => ({ value: item, label: item }))],
    [availableCategories],
  );

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Contabilidad</h1>
            <p className="mt-1 text-sm text-zinc-600">Libro unificado de ingresos y egresos.</p>
          </div>
          <Link to="/admin" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Panel
          </Link>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="INGRESOS" value={money(summary.inflowTotal)} tone="text-emerald-700" />
        <StatCard title="EGRESOS" value={money(summary.outflowTotal)} tone="text-rose-700" />
        <section className="card">
          <div className="card-body">
            <div className="text-sm font-black uppercase tracking-wide text-zinc-500">NETO</div>
            <div
              className={`mt-2 text-5xl font-black tracking-tight ${
                summary.netTotal >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {money(summary.netTotal)}
            </div>
            <div className="mt-1 text-sm text-zinc-600">Asientos: {summary.entriesCount}</div>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <div className="text-xl font-black tracking-tight text-zinc-900">Resultado por categoría</div>
          <p className="mt-1 text-sm text-zinc-500">
            Comparativo de ingresos y egresos por tipo de movimiento.
          </p>
        </div>
        <div className="card-body">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((item) => (
              <div key={item.category} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-3xl font-black tracking-tight text-zinc-900">{item.category}</div>
                <div className="mt-1 text-sm text-zinc-600">Asientos: {item.entriesCount}</div>
                <div className="mt-2 text-sm text-zinc-700">
                  Ingreso: <span className="font-black text-emerald-700">{money(item.inflowTotal)}</span>
                </div>
                <div className="text-sm text-zinc-700">
                  Egreso: <span className="font-black text-rose-700">{money(item.outflowTotal)}</span>
                </div>
                <div
                  className={`mt-2 text-xl font-black tracking-tight ${
                    item.netTotal >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  Neto: {money(item.netTotal)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-body">
          <div className="grid gap-3 xl:grid-cols-[1.5fr_0.8fr_0.8fr_0.7fr_0.7fr_auto]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar descripción, evento o tipo..."
              className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm"
            />
            <CustomSelect
              value={direction}
              onChange={(value) => setDirection(value as '' | 'inflow' | 'outflow')}
              options={directionOptions}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Filtrar por dirección"
            />
            <CustomSelect
              value={category}
              onChange={setCategory}
              options={categoryOptions}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Filtrar por categoría"
            />
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRefreshTick((value) => value + 1)}
                className="btn-outline !h-11 !rounded-xl px-4 text-sm font-bold"
              >
                Filtrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setQ('');
                  setDirection('');
                  setCategory('');
                  setRefreshTick((value) => value + 1);
                }}
                className="btn-ghost !h-11 !rounded-xl px-4 text-sm font-bold"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_8px_30px_-18px_#0f172a47]">
        <div className="grid grid-cols-[1.1fr_0.8fr_0.8fr_1.4fr_1fr_0.8fr] gap-3 bg-zinc-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500">
          <div>FECHA</div>
          <div>DIRECCIÓN</div>
          <div>CATEGORÍA</div>
          <div>DESCRIPCIÓN</div>
          <div>EVENTO</div>
          <div className="text-right">MONTO</div>
        </div>
        {loading ? (
          <div className="px-4 py-8 text-sm text-zinc-600">Cargando asientos...</div>
        ) : (
          rows.map((row, index) => (
            <div
              key={row.id}
              className={`grid grid-cols-[1.1fr_0.8fr_0.8fr_1.4fr_1fr_0.8fr] items-center gap-3 px-3 py-3 ${
                index ? 'border-t border-zinc-100' : ''
              }`}
            >
              <div className="text-sm font-bold text-zinc-900">{row.date}</div>
              <div>
                <span
                  className={`inline-flex h-8 items-center rounded-full border px-3 text-sm font-bold ${
                    row.direction === 'Ingreso'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}
                >
                  {row.direction}
                </span>
              </div>
              <div className="text-sm font-bold text-zinc-900">{row.category}</div>
              <div>
                <div className="text-sm font-black text-zinc-900">{row.description}</div>
              </div>
              <div className="text-sm text-zinc-500">{row.source}</div>
              <div
                className={`text-right text-xl font-black ${
                  row.direction === 'Ingreso' ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {money(Math.abs(row.amount))}
              </div>
            </div>
          ))
        )}
        {!loading && rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-600">Sin movimientos en el rango seleccionado.</div>
        ) : null}
      </section>
    </div>
  );
}

function StatCard({ title, value, tone = 'text-zinc-900' }: { title: string; value: string; tone?: string }) {
  return (
    <section className="card">
      <div className="card-body">
        <div className="text-sm font-black uppercase tracking-wide text-zinc-500">{title}</div>
        <div className={`mt-2 text-5xl font-black tracking-tight ${tone}`}>{value}</div>
      </div>
    </section>
  );
}
