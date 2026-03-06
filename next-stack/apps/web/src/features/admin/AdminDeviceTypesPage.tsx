import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from './api';

type DeviceTypeRow = {
  id: string;
  name: string;
  slug: string;
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
  const [rows, setRows] = useState<DeviceTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.deviceTypes();
      setRows(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando tipos de dispositivo');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createRow() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      await adminApi.createDeviceType({ name, active: newActive });
      setNewName('');
      setNewActive(true);
      setSuccess('Tipo de dispositivo creado.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el tipo de dispositivo');
    } finally {
      setCreating(false);
    }
  }

  function updateRow(id: string, patch: Partial<DeviceTypeRow>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function saveRow(row: DeviceTypeRow) {
    setSavingId(row.id);
    setError('');
    setSuccess('');
    try {
      await adminApi.updateDeviceType(row.id, {
        name: row.name.trim(),
        active: row.active,
      });
      setSuccess('Tipo de dispositivo actualizado.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el tipo');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Tipos de dispositivo</h1>
            <p className="mt-1 text-sm text-zinc-600">Categorías base del catálogo (Celular, Notebook, Consola, etc.).</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/precios" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Precios
            </Link>
            <Link to="/admin/catalogodispositivos" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Catálogo
            </Link>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</div> : null}

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
            <button
              type="button"
              onClick={() => void createRow()}
              disabled={creating || !newName.trim()}
              className="btn-primary !h-11 !w-full !rounded-2xl justify-center disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card-head flex items-center justify-between gap-2">
            <div className="text-xl font-black tracking-tight text-zinc-900">Listado</div>
            <span className="badge-zinc">{loading ? '-' : rows.length}</span>
          </div>
          <div className="card-body space-y-0">
            <div className="grid grid-cols-[1.5fr_0.7fr_0.9fr_0.6fr] gap-3 border-b border-zinc-100 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500">
              <div>Tipo</div>
              <div>Activo</div>
              <div>Slug</div>
              <div className="text-right">Acción</div>
            </div>
            {loading ? (
              <div className="p-4 text-sm text-zinc-600">Cargando...</div>
            ) : rows.length === 0 ? (
              <div className="p-4 text-sm text-zinc-600">Sin tipos cargados.</div>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="grid grid-cols-[1.5fr_0.7fr_0.9fr_0.6fr] items-center gap-3 border-b border-zinc-100 px-3 py-2.5 last:border-b-0">
                  <input
                    value={row.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      updateRow(row.id, { name, slug: row.slug || toSlug(name) });
                    }}
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
                  <div className="truncate text-sm text-zinc-600">{row.slug || toSlug(row.name) || '-'}</div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => void saveRow(row)}
                      disabled={savingId === row.id || !row.name.trim()}
                      className="btn-outline !h-9 !rounded-xl px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingId === row.id ? '...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
