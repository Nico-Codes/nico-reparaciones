import { Link } from 'react-router-dom';
import { SectionCard } from '@/components/ui/section-card';
import type { DeviceTypeRow } from './admin-device-types.helpers';
import { buildDeviceTypeDisplaySlug } from './admin-device-types.helpers';

type AdminDeviceTypesLayoutProps = {
  newName: string;
  newActive: boolean;
  rows: DeviceTypeRow[];
  loading: boolean;
  creating: boolean;
  savingId: string | null;
  deletingId: string | null;
  focusedId: string;
  error: string;
  success: string;
  onNewNameChange: (value: string) => void;
  onNewActiveChange: (value: boolean) => void;
  onCreate: () => void;
  onRowChange: (id: string, patch: Partial<DeviceTypeRow>) => void;
  onSave: (row: DeviceTypeRow) => void;
  onDelete: (row: DeviceTypeRow) => void;
};

export function AdminDeviceTypesLayout({
  newName,
  newActive,
  rows,
  loading,
  creating,
  savingId,
  deletingId,
  focusedId,
  error,
  success,
  onNewNameChange,
  onNewActiveChange,
  onCreate,
  onRowChange,
  onSave,
  onDelete,
}: AdminDeviceTypesLayoutProps) {
  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Tipos de dispositivo</h1>
            <p className="mt-1 text-sm text-zinc-600">Categorias base del catalogo (Celular, Notebook, Consola, etc.).</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/calculos/reparaciones" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">Hub reparaciones</Link>
            <Link to="/admin/catalogodispositivos" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">Catalogo</Link>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</div> : null}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <SectionCard title="Crear tipo">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-zinc-800">Nombre</label>
              <input value={newName} onChange={(event) => onNewNameChange(event.target.value)} placeholder="Ej: Celular" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800">
              <input type="checkbox" checked={newActive} onChange={(event) => onNewActiveChange(event.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
              Activo
            </label>
            <button type="button" onClick={onCreate} disabled={creating || !newName.trim()} className="btn-primary !h-11 !w-full !rounded-2xl justify-center disabled:cursor-not-allowed disabled:opacity-60">
              {creating ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Listado" actions={<span className="badge-zinc">{loading ? '-' : rows.length}</span>}>
          <div className="space-y-0">
            <div className="grid grid-cols-[1.5fr_0.7fr_0.9fr_0.6fr] gap-3 border-b border-zinc-100 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500">
              <div>Tipo</div>
              <div>Activo</div>
              <div>Slug</div>
              <div className="text-right">Accion</div>
            </div>
            {loading ? (
              <div className="p-4 text-sm text-zinc-600">Cargando...</div>
            ) : rows.length === 0 ? (
              <div className="p-4 text-sm text-zinc-600">Sin tipos cargados.</div>
            ) : (
              rows.map((row) => (
                <div
                  key={row.id}
                  className={`grid grid-cols-[1.35fr_0.7fr_0.85fr_0.95fr] items-center gap-3 border-b border-zinc-100 px-3 py-2.5 last:border-b-0 ${
                    focusedId === row.id ? 'bg-sky-50/70' : ''
                  }`}
                >
                  <input value={row.name} onChange={(event) => onRowChange(row.id, { name: event.target.value })} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
                  <label className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800">
                    <input type="checkbox" checked={row.active} onChange={(event) => onRowChange(row.id, { active: event.target.checked })} className="h-4 w-4 rounded border-zinc-300" />
                    Activo
                  </label>
                  <div className="truncate text-sm text-zinc-600">{buildDeviceTypeDisplaySlug(row)}</div>
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={() => onSave(row)} disabled={savingId === row.id || deletingId === row.id || !row.name.trim()} className="btn-outline !h-9 !rounded-xl px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
                      {savingId === row.id ? '...' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row)}
                      disabled={savingId === row.id || deletingId === row.id}
                      className="inline-flex h-9 items-center rounded-xl border border-rose-200 bg-white px-4 text-sm font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === row.id ? '...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
