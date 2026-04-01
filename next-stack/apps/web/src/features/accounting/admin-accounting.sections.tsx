import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import type { AdminAccountingItem } from '@/features/admin/api';
import {
  ACCOUNTING_DIRECTION_OPTIONS,
  formatAccountingMoney,
  resolveAccountingAmountTone,
  resolveAccountingDirectionClass,
  resolveAccountingNetTone,
  type AccountingCategorySummaryItem,
  type AccountingSummary,
} from './admin-accounting.helpers';

export function AdminAccountingHero() {
  return (
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
  );
}

export function AdminAccountingFeedback({ error }: { error: string }) {
  return error ? (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
  ) : null;
}

export function AdminAccountingSummaryCards({ summary }: { summary: AccountingSummary }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <AccountingStatCard title="INGRESOS" value={formatAccountingMoney(summary.inflowTotal)} tone="text-emerald-700" />
      <AccountingStatCard title="EGRESOS" value={formatAccountingMoney(summary.outflowTotal)} tone="text-rose-700" />
      <section className="card">
        <div className="card-body">
          <div className="text-sm font-black uppercase tracking-wide text-zinc-500">NETO</div>
          <div className={`mt-2 text-5xl font-black tracking-tight ${resolveAccountingNetTone(summary.netTotal)}`}>
            {formatAccountingMoney(summary.netTotal)}
          </div>
          <div className="mt-1 text-sm text-zinc-600">Asientos: {summary.entriesCount}</div>
        </div>
      </section>
    </div>
  );
}

export function AdminAccountingCategorySummarySection({
  categories,
}: {
  categories: AccountingCategorySummaryItem[];
}) {
  return (
    <section className="card">
      <div className="card-head">
        <div className="text-xl font-black tracking-tight text-zinc-900">Resultado por categoria</div>
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
                Ingreso: <span className="font-black text-emerald-700">{formatAccountingMoney(item.inflowTotal)}</span>
              </div>
              <div className="text-sm text-zinc-700">
                Egreso: <span className="font-black text-rose-700">{formatAccountingMoney(item.outflowTotal)}</span>
              </div>
              <div className={`mt-2 text-xl font-black tracking-tight ${resolveAccountingNetTone(item.netTotal)}`}>
                Neto: {formatAccountingMoney(item.netTotal)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AdminAccountingFilters({
  q,
  direction,
  category,
  from,
  to,
  categoryOptions,
  onQueryChange,
  onDirectionChange,
  onCategoryChange,
  onFromChange,
  onToChange,
  onApply,
  onClear,
}: {
  q: string;
  direction: '' | 'inflow' | 'outflow';
  category: string;
  from: string;
  to: string;
  categoryOptions: Array<{ value: string; label: string }>;
  onQueryChange: (value: string) => void;
  onDirectionChange: (value: '' | 'inflow' | 'outflow') => void;
  onCategoryChange: (value: string) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <section className="card">
      <div className="card-body">
        <div className="grid gap-3 xl:grid-cols-[1.5fr_0.8fr_0.8fr_0.7fr_0.7fr_auto]">
          <input
            value={q}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar descripcion, evento o tipo..."
            className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm"
          />
          <CustomSelect
            value={direction}
            onChange={(value) => onDirectionChange(value as '' | 'inflow' | 'outflow')}
            options={ACCOUNTING_DIRECTION_OPTIONS}
            triggerClassName="min-h-11 rounded-2xl font-bold"
            ariaLabel="Filtrar por direccion"
          />
          <CustomSelect
            value={category}
            onChange={onCategoryChange}
            options={categoryOptions}
            triggerClassName="min-h-11 rounded-2xl font-bold"
            ariaLabel="Filtrar por categoria"
          />
          <input
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm"
          />
          <input
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onApply}
              className="btn-outline !h-11 !rounded-xl px-4 text-sm font-bold"
            >
              Filtrar
            </button>
            <button
              type="button"
              onClick={onClear}
              className="btn-ghost !h-11 !rounded-xl px-4 text-sm font-bold"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminAccountingEntriesSection({
  rows,
  loading,
}: {
  rows: AdminAccountingItem[];
  loading: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_8px_30px_-18px_#0f172a47]">
      <div className="grid grid-cols-[1.1fr_0.8fr_0.8fr_1.4fr_1fr_0.8fr] gap-3 bg-zinc-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500">
        <div>FECHA</div>
        <div>DIRECCION</div>
        <div>CATEGORIA</div>
        <div>DESCRIPCION</div>
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
                className={`inline-flex h-8 items-center rounded-full border px-3 text-sm font-bold ${resolveAccountingDirectionClass(row.direction)}`}
              >
                {row.direction}
              </span>
            </div>
            <div className="text-sm font-bold text-zinc-900">{row.category}</div>
            <div>
              <div className="text-sm font-black text-zinc-900">{row.description}</div>
            </div>
            <div className="text-sm text-zinc-500">{row.source}</div>
            <div className={`text-right text-xl font-black ${resolveAccountingAmountTone(row.direction)}`}>
              {formatAccountingMoney(Math.abs(row.amount))}
            </div>
          </div>
        ))
      )}
      {!loading && rows.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-zinc-600">Sin movimientos en el rango seleccionado.</div>
      ) : null}
    </section>
  );
}

function AccountingStatCard({
  title,
  value,
  tone = 'text-zinc-900',
}: {
  title: string;
  value: string;
  tone?: string;
}) {
  return (
    <section className="card">
      <div className="card-body">
        <div className="text-sm font-black uppercase tracking-wide text-zinc-500">{title}</div>
        <div className={`mt-2 text-5xl font-black tracking-tight ${tone}`}>{value}</div>
      </div>
    </section>
  );
}
