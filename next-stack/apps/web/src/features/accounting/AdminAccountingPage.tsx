import { Link } from 'react-router-dom';

type AccountingRow = {
  id: string;
  date: string;
  direction: 'Ingreso' | 'Egreso';
  category: string;
  description: string;
  source: string;
  amount: number;
};

const ROWS: AccountingRow[] = [
  {
    id: 'acc-1',
    date: '25/02/2026 10:11',
    direction: 'Ingreso',
    category: 'order_sale',
    description: 'Venta web pedido #2',
    source: 'App\\Models\\Order #2',
    amount: 3510,
  },
];

function money(n: number) {
  return `$ ${n.toLocaleString('es-AR')}`;
}

export function AdminAccountingPage() {
  const incomes = ROWS.filter((r) => r.direction === 'Ingreso').reduce((a, r) => a + r.amount, 0);
  const expenses = ROWS.filter((r) => r.direction === 'Egreso').reduce((a, r) => a + r.amount, 0);
  const net = incomes - expenses;
  const byCategory = new Map<string, { incomes: number; expenses: number; count: number }>();

  for (const row of ROWS) {
    const current = byCategory.get(row.category) ?? { incomes: 0, expenses: 0, count: 0 };
    current.count += 1;
    if (row.direction === 'Ingreso') current.incomes += row.amount;
    else current.expenses += row.amount;
    byCategory.set(row.category, current);
  }

  const categories = [...byCategory.entries()].map(([key, value]) => ({
    key,
    ...value,
    net: value.incomes - value.expenses,
  }));

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Contabilidad</h1>
            <p className="mt-1 text-sm text-zinc-600">Libro unificado de ingresos y egresos.</p>
          </div>
          <Link to="/admin" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">Panel</Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="INGRESOS" value={money(incomes)} tone="text-emerald-700" />
        <StatCard title="EGRESOS" value={money(expenses)} tone="text-rose-700" />
        <section className="card">
          <div className="card-body">
            <div className="text-sm font-black uppercase tracking-wide text-zinc-500">NETO</div>
            <div className={`mt-2 text-5xl font-black tracking-tight ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{money(net)}</div>
            <div className="mt-1 text-sm text-zinc-600">Asientos: {ROWS.length}</div>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <div className="text-xl font-black tracking-tight text-zinc-900">Resultado por categoría</div>
          <p className="mt-1 text-sm text-zinc-500">Comparativo de ingresos y egresos por tipo de movimiento.</p>
        </div>
        <div className="card-body">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((c) => (
              <div key={c.key} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-3xl font-black tracking-tight text-zinc-900">{c.key}</div>
                <div className="mt-1 text-sm text-zinc-600">Asientos: {c.count}</div>
                <div className="mt-2 text-sm text-zinc-700">Ingreso: <span className="font-black text-emerald-700">{money(c.incomes)}</span></div>
                <div className="text-sm text-zinc-700">Egreso: <span className="font-black text-rose-700">{money(c.expenses)}</span></div>
                <div className="mt-2 text-xl font-black tracking-tight text-emerald-700">Neto: {money(c.net)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-body">
          <div className="grid gap-3 xl:grid-cols-[1.5fr_0.8fr_0.8fr_0.7fr_0.7fr_auto]">
            <input placeholder="Buscar descripcion, evento o tipo..." className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm" />
            <select className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm font-bold"><option>Direccion: Todas</option></select>
            <select className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm font-bold"><option>Categoria: Todas</option></select>
            <input type="date" defaultValue="2026-01-26" className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm" />
            <input type="date" defaultValue="2026-02-25" className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm" />
            <div className="flex items-center gap-2">
              <button type="button" className="btn-outline !h-11 !rounded-xl px-4 text-sm font-bold">Filtrar</button>
              <button type="button" className="btn-ghost !h-11 !rounded-xl px-4 text-sm font-bold">Limpiar</button>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_8px_30px_-18px_#0f172a47]">
        <div className="grid grid-cols-[1.1fr_0.8fr_0.8fr_1.4fr_1fr_0.8fr] gap-3 bg-zinc-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500">
          <div>FECHA</div>
          <div>DIRECCION</div>
          <div>CATEGORIA</div>
          <div>DESCRIPCION</div>
          <div>EVENTO</div>
          <div className="text-right">MONTO</div>
        </div>
        {ROWS.map((r, idx) => (
          <div key={r.id} className={`grid grid-cols-[1.1fr_0.8fr_0.8fr_1.4fr_1fr_0.8fr] items-center gap-3 px-3 py-3 ${idx ? 'border-t border-zinc-100' : ''}`}>
            <div className="text-sm font-bold text-zinc-900">{r.date}</div>
            <div>
              <span className={`inline-flex h-8 items-center rounded-full border px-3 text-sm font-bold ${r.direction === 'Ingreso' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{r.direction}</span>
            </div>
            <div className="text-sm font-bold text-zinc-900">{r.category}</div>
            <div>
              <div className="text-sm font-black text-zinc-900">{r.description}</div>
              <div className="text-sm text-zinc-500">{r.source}</div>
            </div>
            <div className="text-sm text-zinc-500">order_sale:2</div>
            <div className={`text-right text-xl font-black ${r.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{money(Math.abs(r.amount))}</div>
          </div>
        ))}
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
