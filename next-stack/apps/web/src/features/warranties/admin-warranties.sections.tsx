import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import type { AdminWarrantyItem } from '@/features/admin/api';
import {
  buildAdminWarrantiesStatCards,
  buildWarrantyRelatedLine,
  formatWarrantyMoney,
  getWarrantyStatusBadgeClass,
  type AdminWarrantySupplierStat,
  type AdminWarrantiesFilters,
  type AdminWarrantiesSummary,
  warrantySourceTypeOptions,
  warrantyStatusOptions,
} from './admin-warranties.helpers';

type AdminWarrantiesFeedbackProps = {
  error: string;
  message: string;
};

type AdminWarrantiesStatsGridProps = {
  summary: AdminWarrantiesSummary;
};

type AdminWarrantiesTopSupplierSectionProps = {
  topSupplier: AdminWarrantySupplierStat | null;
};

type AdminWarrantiesFiltersSectionProps = {
  filters: AdminWarrantiesFilters;
  onChange: <K extends keyof AdminWarrantiesFilters>(field: K, value: AdminWarrantiesFilters[K]) => void;
  onRefresh: () => void;
  onClear: () => void;
};

type AdminWarrantiesTableProps = {
  items: AdminWarrantyItem[];
  loading: boolean;
  onClose: (id: string) => void;
};

export function AdminWarrantiesHero() {
  return (
    <section className="store-hero">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Garantias y perdidas</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Registro de costos por garantias en reparaciones y productos.
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
  );
}

export function AdminWarrantiesFeedback({ error, message }: AdminWarrantiesFeedbackProps) {
  return (
    <>
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
    </>
  );
}

export function AdminWarrantiesStatsGrid({ summary }: AdminWarrantiesStatsGridProps) {
  const cards = buildAdminWarrantiesStatCards(summary);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.title} title={card.title} value={card.value} valueClass={card.valueClass} />
      ))}
    </div>
  );
}

export function AdminWarrantiesTopSupplierSection({ topSupplier }: AdminWarrantiesTopSupplierSectionProps) {
  return (
    <section className="card">
      <div className="card-head">
        <div className="text-xl font-black tracking-tight text-zinc-900">Proveedores con mas perdida</div>
        <p className="mt-1 text-sm text-zinc-500">Top por monto acumulado en incidentes de garantia.</p>
      </div>
      <div className="card-body">
        {topSupplier ? (
          <div className="max-w-[260px] rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-3xl font-black tracking-tight text-zinc-900">{topSupplier.name}</div>
            <div className="mt-1 text-sm text-zinc-600">Incidentes: {topSupplier.incidentsCount}</div>
            <div className="mt-2 text-2xl font-black tracking-tight text-rose-700">
              {formatWarrantyMoney(topSupplier.totalLoss)}
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-600">Sin incidentes.</div>
        )}
      </div>
    </section>
  );
}

export function AdminWarrantiesFiltersSection({
  filters,
  onChange,
  onRefresh,
  onClear,
}: AdminWarrantiesFiltersSectionProps) {
  return (
    <section className="card">
      <div className="card-body">
        <div className="grid gap-3 xl:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr_0.7fr_auto]">
          <input
            value={filters.q}
            onChange={(event) => onChange('q', event.target.value)}
            placeholder="Buscar titulo, motivo o nota..."
            className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
          />
          <CustomSelect
            value={filters.sourceType}
            onChange={(value) => onChange('sourceType', value as AdminWarrantiesFilters['sourceType'])}
            options={warrantySourceTypeOptions}
            triggerClassName="min-h-11 rounded-2xl font-bold"
            ariaLabel="Filtrar por origen"
          />
          <CustomSelect
            value={filters.status}
            onChange={(value) => onChange('status', value as AdminWarrantiesFilters['status'])}
            options={warrantyStatusOptions}
            triggerClassName="min-h-11 rounded-2xl font-bold"
            ariaLabel="Filtrar por estado"
          />
          <input
            value={filters.from}
            onChange={(event) => onChange('from', event.target.value)}
            type="date"
            className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
          />
          <input
            value={filters.to}
            onChange={(event) => onChange('to', event.target.value)}
            type="date"
            className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
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

export function AdminWarrantiesTable({ items, loading, onClose }: AdminWarrantiesTableProps) {
  return (
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

      {loading ? (
        <div className="px-4 py-8 text-sm text-zinc-600">Cargando incidentes...</div>
      ) : (
        items.map((item, index) => (
          <div key={item.id} className={`${index ? 'border-t border-zinc-100' : ''} px-3 py-3`}>
            <div className="grid gap-3 xl:grid-cols-[0.8fr_0.8fr_2fr_0.9fr_0.8fr_0.8fr_0.8fr_0.7fr_0.8fr_0.8fr] xl:items-center">
              <div className="text-sm font-bold text-zinc-900">
                <div>{item.date}</div>
                <div>{item.time}</div>
              </div>
              <div>
                <span className="inline-flex h-8 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold text-zinc-800">
                  {item.source}
                </span>
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-zinc-900">{item.title}</div>
                <div className="truncate text-sm text-zinc-600">{buildWarrantyRelatedLine(item)}</div>
                <div className="truncate text-sm text-zinc-600">{item.reason || '-'}</div>
              </div>
              <div className="text-sm font-bold text-zinc-900">{item.provider}</div>
              <div>
                <span className="inline-flex h-8 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold text-zinc-800">
                  {item.costSource}
                </span>
              </div>
              <div className="text-right text-sm font-black text-zinc-900">{formatWarrantyMoney(item.cost)}</div>
              <div className="text-right text-sm font-black text-emerald-700">
                {formatWarrantyMoney(item.recovered)}
              </div>
              <div className="text-right text-sm font-black text-rose-700">{formatWarrantyMoney(item.loss)}</div>
              <div>
                <span
                  className={`inline-flex h-8 items-center rounded-full border px-3 text-sm font-bold ${getWarrantyStatusBadgeClass(item.status)}`}
                >
                  {item.statusLabel}
                </span>
              </div>
              <div className="text-right">
                {item.status === 'open' ? (
                  <button
                    type="button"
                    onClick={() => onClose(item.id)}
                    className="btn-outline !h-8 !rounded-xl px-3 text-sm font-bold"
                  >
                    Cerrar
                  </button>
                ) : (
                  <span className="text-xs text-zinc-500">Sin accion</span>
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
