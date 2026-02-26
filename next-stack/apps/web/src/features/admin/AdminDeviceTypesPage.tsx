import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type DeviceTypeRow = {
  id: number;
  name: string;
  active: boolean;
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function AdminDeviceTypesPage() {
  const [newName, setNewName] = useState('');
  const [newActive, setNewActive] = useState(true);
  const [rows, setRows] = useState<DeviceTypeRow[]>([
    { id: 1, name: 'Celular', active: true },
    { id: 2, name: 'Notebook', active: true },
  ]);

  const rowIds = useMemo(() => rows.map((r) => r.id), [rows]);

  function createRow() {
    const name = newName.trim();
    if (!name) return;
    const nextId = (Math.max(0, ...rowIds) || 0) + 1;
    setRows((prev) => [...prev, { id: nextId, name, active: newActive }]);
    setNewName('');
    setNewActive(true);
  }

  function updateRow(id: number, patch: Partial<DeviceTypeRow>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Tipos de dispositivo</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Categorias base del catalogo (Celular, Notebook, Consola, etc.).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/precios" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Precios
            </Link>
            <Link to="/admin/catalogodispositivos" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Catalogo
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <section className="card">
          <div className="card-head">
            <div className="text-xl font-black tracking-tight text-zinc-900">Crear tipo</div>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-zinc-800">Nombre</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Celular"
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800">
              <input
                type="checkbox"
                checked={newActive}
                onChange={(e) => setNewActive(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300"
              />
              Activo
            </label>
            <button type="button" onClick={createRow} className="btn-primary !h-11 !w-full !rounded-2xl justify-center">
              Crear
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card-head flex items-center justify-between gap-2">
            <div className="text-xl font-black tracking-tight text-zinc-900">Listado</div>
            <span className="badge-zinc">{rows.length}</span>
          </div>
          <div className="card-body space-y-0">
            <div className="grid grid-cols-[1.5fr_0.7fr_0.9fr_0.5fr] gap-3 border-b border-zinc-100 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500">
              <div>Tipo</div>
              <div>Activo</div>
              <div>Slug</div>
              <div className="text-right">Accion</div>
            </div>
            {rows.map((row) => (
              <div key={row.id} className="grid grid-cols-[1.5fr_0.7fr_0.9fr_0.5fr] items-center gap-3 border-b border-zinc-100 px-3 py-2.5 last:border-b-0">
                <input
                  value={row.name}
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm"
                />
                <label className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800">
                  <input
                    type="checkbox"
                    checked={row.active}
                    onChange={(e) => updateRow(row.id, { active: e.target.checked })}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  Activo
                </label>
                <div className="truncate text-sm text-zinc-600">{toSlug(row.name) || '-'}</div>
                <div className="text-right">
                  <button type="button" className="btn-outline !h-9 !rounded-xl px-4 text-sm font-bold">
                    Guardar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
