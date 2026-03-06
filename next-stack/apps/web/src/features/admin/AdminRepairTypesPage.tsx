import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';

type RepairTypeRow = {
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

export function AdminRepairTypesPage() {
  const [newName, setNewName] = useState('');
  const [newActive, setNewActive] = useState(true);
  const [rows, setRows] = useState<RepairTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const count = rows.length;
  const sortedRows = useMemo(() => rows, [rows]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await deviceCatalogApi.issues();
      setRows(
        res.items.map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          active: item.active,
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando tipos de reparación');
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
      await deviceCatalogApi.createIssue({ name, slug: toSlug(name), active: newActive });
      setNewName('');
      setNewActive(true);
      setSuccess('Tipo creado.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el tipo');
    } finally {
      setCreating(false);
    }
  }

  function updateRow(id: string, patch: Partial<RepairTypeRow>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function saveRow(row: RepairTypeRow) {
    setSavingId(row.id);
    setError('');
    setSuccess('');
    try {
      await deviceCatalogApi.updateIssue(row.id, {
        name: row.name.trim(),
        slug: row.slug.trim() || toSlug(row.name),
        active: row.active,
      });
      setSuccess('Tipo guardado.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el tipo');
    } finally {
      setSavingId(null);
    }
  }

  async function deleteRow(id: string) {
    setDeletingId(id);
    setError('');
    setSuccess('');
    try {
      await deviceCatalogApi.deleteIssue(id);
      setSuccess('Tipo eliminado.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar el tipo');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Tipos de reparación</h1>
            <p className="mt-1 text-sm text-zinc-600">Estos son los tipos usados en el cálculo automático.</p>
          </div>
          <Link to="/admin/precios" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Precios
          </Link>
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
                placeholder="Ej: Módulo"
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
            <span className="badge-zinc">{loading ? '-' : count}</span>
          </div>
          <div className="card-body space-y-3">
            {loading ? <div className="h-24 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50" /> : null}
            {!loading && sortedRows.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">Sin tipos de reparación cargados.</div>
            ) : null}
            {sortedRows.map((row) => (
              <div key={row.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                <div className="grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-center">
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-wide text-zinc-500">Nombre</label>
                    <input
                      value={row.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        updateRow(row.id, { name, slug: toSlug(name) });
                      }}
                      className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-wide text-zinc-500">Slug</label>
                    <input
                      value={row.slug}
                      onChange={(e) => updateRow(row.id, { slug: e.target.value })}
                      className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800 md:self-end md:pb-1">
                    <input
                      type="checkbox"
                      checked={row.active}
                      onChange={(e) => updateRow(row.id, { active: e.target.checked })}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    Activo
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void saveRow(row)}
                    disabled={savingId === row.id || deletingId === row.id || !row.name.trim()}
                    className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingId === row.id ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteRow(row.id)}
                    disabled={savingId === row.id || deletingId === row.id}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === row.id ? 'Eliminando...' : 'Eliminar'}
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
