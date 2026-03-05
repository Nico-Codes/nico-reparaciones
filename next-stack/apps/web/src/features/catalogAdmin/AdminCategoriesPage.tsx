import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { catalogAdminApi, type AdminCategory } from './api';

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function AdminCategoriesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: editIdParam } = useParams<{ id?: string }>();
  const isCreateRoute = location.pathname === '/admin/categorias/crear';
  const editId = editIdParam ?? null;

  const [items, setItems] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [active, setActive] = useState(true);
  const [slugAuto, setSlugAuto] = useState(true);

  async function loadCategories() {
    setLoading(true);
    setError('');
    try {
      const res = await catalogAdminApi.categories();
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando categorias');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  const editingItem = useMemo(
    () => (editId ? items.find((c) => c.id === editId) ?? null : null),
    [items, editId],
  );

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setSlug(editingItem.slug);
      setActive(editingItem.active);
      setSlugAuto(false);
      setNotice('');
      return;
    }
    if (!editId || isCreateRoute) {
      setName('');
      setSlug('');
      setActive(true);
      setSlugAuto(true);
      setNotice('');
    }
  }, [editingItem, editId, isCreateRoute]);

  function onNameChange(next: string) {
    setName(next);
    if (slugAuto) {
      setSlug(slugify(next));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        name: name.trim(),
        slug: (slug.trim() || slugify(name.trim())).slice(0, 120),
        active,
      };
      if (editId && editingItem) {
        await catalogAdminApi.updateCategory(editId, payload);
        setNotice('Categoria actualizada correctamente.');
        await loadCategories();
      } else {
        const res = await catalogAdminApi.createCategory(payload);
        setNotice('Categoria creada correctamente.');
        await loadCategories();
        navigate(`/admin/categorias/${encodeURIComponent(res.item.id)}/editar`, { replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando categoria');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: AdminCategory) {
    setError('');
    setNotice('');
    try {
      await catalogAdminApi.updateCategory(item.id, { active: !item.active });
      await loadCategories();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error actualizando estado');
    }
  }

  async function removeCategory(item: AdminCategory) {
    if (!window.confirm(`Eliminar categoria "${item.name}"?`)) return;
    setError('');
    setNotice('');
    try {
      await catalogAdminApi.deleteCategory(item.id);
      if (editId === item.id) {
        navigate('/admin/categorias', { replace: true });
      }
      setNotice('Categoria eliminada.');
      await loadCategories();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error eliminando categoria');
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Categorias</h1>
            <p className="mt-1 text-sm text-zinc-600">Gestiona categorias del catalogo de tienda.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/productos" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Volver a productos
            </Link>
            <Link to="/admin/categorias/crear" className="btn-primary !h-10 !rounded-xl px-5 text-sm font-bold">
              Nueva categoria
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      ) : null}
      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <section className="card">
          <div className="card-head">
            <div className="text-xl font-black tracking-tight text-zinc-900">Listado</div>
            <p className="mt-1 text-sm text-zinc-500">Categorias disponibles para productos.</p>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-sm text-zinc-600">Cargando categorias...</div>
            ) : items.length === 0 ? (
              <div className="text-sm text-zinc-600">No hay categorias.</div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className={`rounded-2xl border px-4 py-3 ${
                      editId === item.id ? 'border-sky-300 bg-sky-50/40' : 'border-zinc-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-base font-black tracking-tight text-zinc-900">{item.name}</div>
                        <div className="text-xs text-zinc-500">/{item.slug}</div>
                      </div>
                      <span
                        className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-bold ${
                          item.active
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-zinc-200 bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {item.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">Productos asociados: {item.productsCount}</div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Link
                        to={`/admin/categorias/${encodeURIComponent(item.id)}/editar`}
                        className="btn-outline !h-8 !rounded-xl px-3 text-xs font-bold"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => void toggleActive(item)}
                        className="btn-outline !h-8 !rounded-xl px-3 text-xs font-bold"
                      >
                        {item.active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeCategory(item)}
                        disabled={item.productsCount > 0}
                        className="btn-outline !h-8 !rounded-xl px-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
                        title={item.productsCount > 0 ? 'No se puede eliminar: tiene productos asociados' : 'Eliminar categoria'}
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div className="text-xl font-black tracking-tight text-zinc-900">
              {editId && editingItem ? 'Editar categoria' : 'Nueva categoria'}
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {editId && editingItem
                ? 'Actualiza nombre, slug y estado.'
                : 'Crea una categoria para organizar productos.'}
            </p>
          </div>
          <div className="card-body">
            {editId && !editingItem ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                La categoria seleccionada no existe.
              </div>
            ) : (
              <form className="space-y-4" onSubmit={onSubmit}>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-zinc-600">Nombre</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Ej: Fundas"
                    className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-0 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-zinc-600">Slug</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugAuto(false);
                    }}
                    placeholder="fundas"
                    className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-0 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                    required
                  />
                </label>

                <label className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  Categoria activa
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <button type="submit" disabled={saving} className="btn-primary !h-10 !rounded-xl px-5 text-sm font-bold">
                    {saving ? 'Guardando...' : editId && editingItem ? 'Guardar cambios' : 'Crear categoria'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setName('');
                      setSlug('');
                      setActive(true);
                      setSlugAuto(true);
                      navigate('/admin/categorias/crear');
                    }}
                    className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold"
                  >
                    Limpiar
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
