import { useEffect, useMemo, useRef, useState } from 'react';
import { FolderTree, Layers3, Tag } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { cn } from '@/lib/utils';
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

function categoryTone(active: boolean) {
  return active ? 'success' : 'neutral';
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
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const requestIdRef = useRef(0);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [active, setActive] = useState(true);
  const [slugAuto, setSlugAuto] = useState(true);

  async function loadCategories() {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError('');
    try {
      const res = await catalogAdminApi.categories();
      if (requestId !== requestIdRef.current) return;
      setItems(res.items);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las categorías.');
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  const editingItem = useMemo(
    () => (editId ? items.find((category) => category.id === editId) ?? null : null),
    [items, editId],
  );

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => `${item.name} ${item.slug}`.toLowerCase().includes(normalized));
  }, [items, query]);

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((item) => item.active).length,
      inactive: items.filter((item) => !item.active).length,
    }),
    [items],
  );
  const normalizedName = name.trim();
  const normalizedSlug = (slug.trim() || slugify(normalizedName)).slice(0, 120);
  const hasChanges =
    !editingItem ||
    editingItem.name !== normalizedName ||
    editingItem.slug !== normalizedSlug ||
    editingItem.active !== active;

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

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');

    const trimmedName = normalizedName;

    if (!trimmedName) {
      setError('Ingresá un nombre antes de guardar la categoría.');
      return;
    }

    if (!normalizedSlug) {
      setError('No pudimos generar un slug válido para la categoría.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: trimmedName,
        slug: normalizedSlug,
        active,
      };

      if (editId && editingItem) {
        if (!hasChanges) {
          setNotice('No hay cambios para guardar.');
          return;
        }
        await catalogAdminApi.updateCategory(editId, payload);
        setNotice('Categoría actualizada correctamente.');
        await loadCategories();
      } else {
        const res = await catalogAdminApi.createCategory(payload);
        setNotice('Categoría creada correctamente.');
        await loadCategories();
        navigate(`/admin/categorias/${encodeURIComponent(res.item.id)}/editar`, { replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la categoría.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: AdminCategory) {
    if (pendingActionId === item.id) return;
    setError('');
    setNotice('');
    try {
      setPendingActionId(item.id);
      await catalogAdminApi.updateCategory(item.id, { active: !item.active });
      setNotice(`Categoría ${item.active ? 'desactivada' : 'activada'} correctamente.`);
      await loadCategories();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el estado.');
    } finally {
      setPendingActionId((current) => (current === item.id ? null : current));
    }
  }

  async function removeCategory(item: AdminCategory) {
    if (!window.confirm(`¿Eliminar la categoría "${item.name}"?`)) return;
    if (pendingActionId === item.id) return;

    setError('');
    setNotice('');
    try {
      setPendingActionId(item.id);
      await catalogAdminApi.deleteCategory(item.id);
      if (editId === item.id) {
        navigate('/admin/categorias', { replace: true });
      }
      setNotice('Categoría eliminada.');
      await loadCategories();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la categoría.');
    } finally {
      setPendingActionId((current) => (current === item.id ? null : current));
    }
  }

  return (
    <PageShell context="admin" className="space-y-5">
      <PageHeader
        context="admin"
        eyebrow="Catálogo"
        title="Categorías"
        subtitle="Organizá el catálogo de tienda con categorías limpias, activas y fáciles de administrar."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/productos">Volver a productos</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/admin/categorias/crear">Nueva categoría</Link>
            </Button>
          </>
        }
      />

      <div className="nr-stat-grid">
        <div className="nr-stat-card">
          <div className="nr-stat-card__label">Categorías</div>
          <div className="nr-stat-card__value">{stats.total}</div>
          <div className="nr-stat-card__meta">Total cargado en tienda.</div>
        </div>
        <div className="nr-stat-card">
          <div className="nr-stat-card__label">Activas</div>
          <div className="nr-stat-card__value">{stats.active}</div>
          <div className="nr-stat-card__meta">Visibles para productos habilitados.</div>
        </div>
        <div className="nr-stat-card">
          <div className="nr-stat-card__label">Inactivas</div>
          <div className="nr-stat-card__value">{stats.inactive}</div>
          <div className="nr-stat-card__meta">Reservadas o fuera de uso.</div>
        </div>
      </div>

      {error ? (
        <div className="ui-alert ui-alert--danger" data-reveal>
          <FolderTree className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No se pudo completar la acción</span>
            <div className="ui-alert__text">{error}</div>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div className="ui-alert ui-alert--success" data-reveal>
          <FolderTree className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Cambios guardados</span>
            <div className="ui-alert__text">{notice}</div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.95fr)]">
        <div className="space-y-5">
          <FilterBar
            actions={<StatusBadge label={`${filteredItems.length} visibles`} tone="info" />}
          >
            <TextField
              label="Buscar"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ej: fundas, cargadores, audio..."
              wrapperClassName="min-w-[16rem] flex-1"
            />
          </FilterBar>

          <SectionCard
            title="Listado"
            description="Revisá el estado, el slug y la cantidad de productos asociados de cada categoría."
            actions={<StatusBadge label={`${stats.total} registradas`} tone="neutral" size="sm" />}
          >
            {loading ? (
              <LoadingBlock label="Cargando categorías" lines={5} />
            ) : filteredItems.length === 0 ? (
              <EmptyState
                icon={<Layers3 className="h-5 w-5" />}
                title={items.length === 0 ? 'Todavía no hay categorías' : 'No encontramos coincidencias'}
                description={
                  items.length === 0
                    ? 'Creá la primera categoría para organizar mejor el catálogo de productos.'
                    : 'Probá con otro nombre o limpiá la búsqueda para ver todas las categorías.'
                }
                actions={
                  items.length === 0 ? (
                    <Button asChild>
                      <Link to="/admin/categorias/crear">Crear categoría</Link>
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <article key={item.id} className={cn('admin-entity-row', editId === item.id && 'is-active')}>
                    <div className="admin-entity-row__top">
                      <div className="admin-entity-row__heading">
                        <div className="admin-entity-row__title-row">
                          <Link to={`/admin/categorias/${encodeURIComponent(item.id)}/editar`} className="admin-entity-row__title">
                            {item.name}
                          </Link>
                          <StatusBadge
                            label={item.active ? 'Activa' : 'Inactiva'}
                            tone={categoryTone(item.active)}
                            size="sm"
                          />
                        </div>
                        <div className="admin-entity-row__meta">
                          <span>Slug: /{item.slug}</span>
                          <span>{item.productsCount} productos asociados</span>
                        </div>
                      </div>

                      <div className="admin-entity-row__aside">
                        <span className="admin-entity-row__eyebrow">Productos vinculados</span>
                        <div className="admin-entity-row__value">{item.productsCount}</div>
                      </div>
                    </div>

                    <div className="admin-entity-row__actions">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/admin/categorias/${encodeURIComponent(item.id)}/editar`}>Editar</Link>
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => void toggleActive(item)} disabled={pendingActionId === item.id}>
                        {pendingActionId === item.id ? 'Guardando...' : item.active ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => void removeCategory(item)}
                        disabled={item.productsCount > 0 || pendingActionId === item.id}
                        title={item.productsCount > 0 ? 'No se puede eliminar mientras tenga productos asociados.' : 'Eliminar categoría'}
                      >
                        {pendingActionId === item.id ? 'Procesando...' : 'Eliminar'}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title={editId && editingItem ? 'Editar categoría' : 'Nueva categoría'}
          description={
            editId && editingItem
              ? 'Actualizá nombre, slug y estado sin salir del catálogo.'
              : 'Creá una categoría clara y consistente para organizar productos.'
          }
          actions={
            editId && editingItem ? <StatusBadge label="Edición" tone="accent" size="sm" /> : <StatusBadge label="Alta" tone="info" size="sm" />
          }
        >
          {editId && !editingItem ? (
            <EmptyState
              icon={<Tag className="h-5 w-5" />}
              title="La categoría seleccionada no existe"
              description="Volvé al listado para elegir otra categoría o creá una nueva desde cero."
              actions={
                <Button asChild>
                  <Link to="/admin/categorias/crear">Crear categoría</Link>
                </Button>
              }
            />
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <TextField
                label="Nombre"
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="Ej: Fundas"
                required
              />

              <TextField
                label="Slug"
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value);
                  setSlugAuto(false);
                }}
                placeholder="fundas"
                hint={slugAuto ? 'Se genera automáticamente a partir del nombre.' : 'Podés editarlo manualmente si necesitás una URL específica.'}
                required
              />

              <div className="space-y-2">
                <div className="ui-field__label">Estado</div>
                <div className="choice-grid">
                  <button
                    type="button"
                    className={cn('choice-card', active && 'is-active')}
                    onClick={() => setActive(true)}
                    disabled={saving}
                  >
                    <div className="choice-card__title">Activa</div>
                    <div className="choice-card__hint">Disponible para productos visibles en tienda.</div>
                  </button>
                  <button
                    type="button"
                    className={cn('choice-card', !active && 'is-active')}
                    onClick={() => setActive(false)}
                    disabled={saving}
                  >
                    <div className="choice-card__title">Inactiva</div>
                    <div className="choice-card__hint">Se conserva en el catálogo, pero deja de ofrecerse.</div>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button type="submit" disabled={saving || (Boolean(editId && editingItem) && !hasChanges)}>
                  {saving ? 'Guardando...' : editId && editingItem ? 'Guardar cambios' : 'Crear categoría'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => {
                    setName('');
                    setSlug('');
                    setActive(true);
                    setSlugAuto(true);
                    navigate('/admin/categorias/crear');
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </form>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
