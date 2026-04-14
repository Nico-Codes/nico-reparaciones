import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { SectionCard } from '@/components/ui/section-card';
import type { RepairTypeRow } from './admin-repair-types.helpers';

type AdminRepairTypesLayoutProps = {
  deviceType: string;
  deviceTypeOptions: Array<{ value: string; label: string }>;
  newName: string;
  newActive: boolean;
  rows: RepairTypeRow[];
  loading: boolean;
  creating: boolean;
  savingId: string | null;
  deletingId: string | null;
  error: string;
  success: string;
  focusedId: string;
  onDeviceTypeChange: (value: string) => void;
  onNewNameChange: (value: string) => void;
  onNewActiveChange: (value: boolean) => void;
  onCreate: () => void;
  onRowChange: (id: string, patch: Partial<RepairTypeRow>) => void;
  onSave: (row: RepairTypeRow) => void;
  onDelete: (id: string) => void;
};

export function AdminRepairTypesLayout({
  deviceType,
  deviceTypeOptions,
  newName,
  newActive,
  rows,
  loading,
  creating,
  savingId,
  deletingId,
  error,
  success,
  focusedId,
  onDeviceTypeChange,
  onNewNameChange,
  onNewActiveChange,
  onCreate,
  onRowChange,
  onSave,
  onDelete,
}: AdminRepairTypesLayoutProps) {
  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Tipos de reparacion</h1>
            <p className="mt-1 text-sm text-zinc-600">Fallas por tipo de dispositivo usadas en el calculo automatico.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/calculos/reparaciones" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Hub reparaciones
            </Link>
            <Link to="/admin/precios" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Precios
            </Link>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</div> : null}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <SectionCard title="Crear falla">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-zinc-800">Tipo de dispositivo</label>
              <CustomSelect
                value={deviceType}
                onChange={onDeviceTypeChange}
                options={deviceTypeOptions}
                triggerClassName="min-h-11 rounded-2xl font-bold"
                ariaLabel="Seleccionar tipo de dispositivo para fallas"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-zinc-800">Nombre</label>
              <input value={newName} onChange={(event) => onNewNameChange(event.target.value)} placeholder="Ej: Modulo" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800">
              <input type="checkbox" checked={newActive} onChange={(event) => onNewActiveChange(event.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
              Activo
            </label>
            <Button type="button" onClick={onCreate} disabled={creating || !deviceType || !newName.trim()} className="w-full justify-center">
              {creating ? 'Creando...' : 'Crear'}
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Listado" actions={<span className="badge-zinc">{loading ? '-' : rows.length}</span>}>
          <div className="space-y-3">
            {loading ? <div className="h-24 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50" /> : null}
            {!loading && rows.length === 0 ? <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">Sin tipos de reparacion cargados.</div> : null}
            {rows.map((row) => (
              <div key={row.id} className={`rounded-2xl border bg-white p-3 ${focusedId === row.id ? 'border-sky-300 ring-2 ring-sky-100' : 'border-zinc-200'}`}>
                <div className="grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-center">
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-wide text-zinc-500">Nombre</label>
                    <input value={row.name} onChange={(event) => onRowChange(row.id, { name: event.target.value })} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-wide text-zinc-500">Slug</label>
                    <input value={row.slug} onChange={(event) => onRowChange(row.id, { slug: event.target.value })} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800 md:self-end md:pb-1">
                    <input type="checkbox" checked={row.active} onChange={(event) => onRowChange(row.id, { active: event.target.checked })} className="h-4 w-4 rounded border-zinc-300" />
                    Activo
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => onSave(row)} disabled={savingId === row.id || deletingId === row.id || !row.name.trim()}>
                    {savingId === row.id ? 'Guardando...' : 'Guardar'}
                  </Button>
                  <button type="button" onClick={() => onDelete(row.id)} disabled={savingId === row.id || deletingId === row.id} className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {deletingId === row.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
