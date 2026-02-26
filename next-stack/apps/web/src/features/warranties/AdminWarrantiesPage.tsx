import { Link } from 'react-router-dom';

const MOCK_INCIDENTS = [
  {
    id: 'gw-1',
    date: '13/02/2026',
    time: '07:53',
    source: 'Reparación',
    title: 'Modulo en garantia',
    repairCode: 'R-20260213-00001',
    customerName: 'nicolas machado',
    reason: 'falla de fabrica',
    provider: 'Puntocell',
    costSource: 'Manual',
    cost: 16000,
    recovered: 0,
    loss: 16000,
    status: 'Abierto',
  },
];

function money(n: number) {
  return `$ ${n.toLocaleString('es-AR')}`;
}

export function AdminWarrantiesPage() {
  const total = MOCK_INCIDENTS.length;
  const open = MOCK_INCIDENTS.filter((i) => i.status === 'Abierto').length;
  const closed = MOCK_INCIDENTS.filter((i) => i.status === 'Cerrado').length;
  const accumulatedLoss = MOCK_INCIDENTS.reduce((acc, i) => acc + i.loss, 0);
  const topProvider = MOCK_INCIDENTS.reduce(
    (acc, i) => {
      acc[i.provider] = (acc[i.provider] ?? 0) + i.loss;
      return acc;
    },
    {} as Record<string, number>,
  );
  const topProviderEntry = Object.entries(topProvider).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Garantias y perdidas</h1>
            <p className="mt-1 text-sm text-zinc-600">Registro de costos por garantias en reparaciones y productos.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">Panel</Link>
            <Link to="/admin/garantias/crear" className="btn-primary !h-10 !rounded-xl px-5 text-sm font-bold">+ Nuevo incidente</Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="TOTAL INCIDENTES" value={String(total)} />
        <StatCard title="ABIERTOS" value={String(open)} valueClass="text-amber-600" />
        <StatCard title="CERRADOS" value={String(closed)} />
        <StatCard title="PERDIDA ACUMULADA" value={money(accumulatedLoss)} valueClass="text-rose-700" />
      </div>

      <section className="card">
        <div className="card-head">
          <div className="text-xl font-black tracking-tight text-zinc-900">Proveedores con mas perdida</div>
          <p className="mt-1 text-sm text-zinc-500">Top por monto acumulado en incidentes de garantia.</p>
        </div>
        <div className="card-body">
          {topProviderEntry ? (
            <div className="max-w-[260px] rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-3xl font-black tracking-tight text-zinc-900">{topProviderEntry[0]}</div>
              <div className="mt-1 text-sm text-zinc-600">Incidentes: {MOCK_INCIDENTS.filter((i) => i.provider === topProviderEntry[0]).length}</div>
              <div className="mt-2 text-2xl font-black tracking-tight text-rose-700">{money(topProviderEntry[1])}</div>
            </div>
          ) : (
            <div className="text-sm text-zinc-600">Sin incidentes.</div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-body">
          <div className="grid gap-3 xl:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr_0.7fr_auto]">
            <input placeholder="Buscar titulo, motivo o nota..." className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            <select className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
              <option>Origen: Todos</option>
            </select>
            <select className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
              <option>Estado: Todos</option>
            </select>
            <input type="date" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            <input type="date" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            <div className="flex items-center gap-2">
              <button type="button" className="btn-outline !h-11 !rounded-xl px-4 text-sm font-bold">Filtrar</button>
              <button type="button" className="btn-ghost !h-11 !rounded-xl px-4 text-sm font-bold">Limpiar</button>
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
          <div className="text-right">PERDIDA</div>
          <div>ESTADO</div>
          <div className="text-right">ACCION</div>
        </div>

        {MOCK_INCIDENTS.map((i, idx) => (
          <div key={i.id} className={`${idx ? 'border-t border-zinc-100' : ''} px-3 py-3`}>
            <div className="grid gap-3 xl:grid-cols-[0.8fr_0.8fr_2fr_0.9fr_0.8fr_0.8fr_0.8fr_0.7fr_0.8fr_0.8fr] xl:items-center">
              <div className="text-sm font-bold text-zinc-900">
                <div>{i.date}</div>
                <div>{i.time}</div>
              </div>
              <div>
                <span className="inline-flex h-8 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold text-zinc-800">{i.source}</span>
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-zinc-900">{i.title}</div>
                <div className="truncate text-sm text-zinc-600">Reparacion: {i.repairCode} - {i.customerName}</div>
                <div className="truncate text-sm text-zinc-600">{i.reason}</div>
              </div>
              <div className="text-sm font-bold text-zinc-900">{i.provider}</div>
              <div>
                <span className="inline-flex h-8 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold text-zinc-800">{i.costSource}</span>
              </div>
              <div className="text-right text-sm font-black text-zinc-900">{money(i.cost)}</div>
              <div className="text-right text-sm font-black text-emerald-700">{money(i.recovered)}</div>
              <div className="text-right text-sm font-black text-rose-700">{money(i.loss)}</div>
              <div>
                <span className="inline-flex h-8 items-center rounded-full border border-amber-300 bg-amber-50 px-3 text-sm font-bold text-amber-700">{i.status}</span>
              </div>
              <div className="text-right">
                <button type="button" className="btn-outline !h-8 !rounded-xl px-3 text-sm font-bold">Cerrar</button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function StatCard(props: { title: string; value: string; valueClass?: string }) {
  return (
    <section className="card">
      <div className="card-body">
        <div className="text-sm font-black uppercase tracking-wide text-zinc-500">{props.title}</div>
        <div className={`mt-2 text-5xl font-black tracking-tight ${props.valueClass ?? 'text-zinc-900'}`}>{props.value}</div>
      </div>
    </section>
  );
}

