import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import {
  AdminCategoriesAlerts,
  AdminCategoriesFilters,
  AdminCategoriesFormSection,
  AdminCategoriesListSection,
  AdminCategoriesStatsGrid,
} from './admin-categories.sections';
import {
  buildCategoryStats,
  filterCategories,
  hasCategoryDraftChanges,
  normalizeCategoryDraft,
  slugifyCategoryName,
} from './admin-categories.helpers';
import { catalogAdminApi, type AdminCategory } from './api';

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
    } catch (cause) {
      if (requestId !== requestIdRef.current) return;
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las categorias.');
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
  const filteredItems = useMemo(() => filterCategories(items, query), [items, query]);
  const stats = useMemo(() => buildCategoryStats(items), [items]);
  const draft = { name, slug, active };
  const normalizedDraft = normalizeCategoryDraft(draft);
  const hasChanges = hasCategoryDraftChanges(editingItem, draft);

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
      setSlug(slugifyCategoryName(next));
    }
  }

  function clearForm() {
    setName('');
    setSlug('');
    setActive(true);
    setSlugAuto(true);
    navigate('/admin/categorias/crear');
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!normalizedDraft.name) {
      setError('Ingresa un nombre antes de guardar la categoria.');
      return;
    }

    if (!normalizedDraft.slug) {
      setError('No pudimos generar un slug valido para la categoria.');
      return;
    }

    setSaving(true);

    try {
      if (editId && editingItem) {
        if (!hasChanges) {
          setNotice('No hay cambios para guardar.');
          return;
        }

        await catalogAdminApi.updateCategory(editId, normalizedDraft);
        setNotice('Categoria actualizada correctamente.');
        await loadCategories();
      } else {
        const res = await catalogAdminApi.createCategory(normalizedDraft);
        setNotice('Categoria creada correctamente.');
        await loadCategories();
        navigate(`/admin/categorias/${encodeURIComponent(res.item.id)}/editar`, { replace: true });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la categoria.');
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
      setNotice(`Categoria ${item.active ? 'desactivada' : 'activada'} correctamente.`);
      await loadCategories();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el estado.');
    } finally {
      setPendingActionId((current) => (current === item.id ? null : current));
    }
  }

  async function removeCategory(item: AdminCategory) {
    if (!window.confirm(`Eliminar la categoria "${item.name}"?`)) return;
    if (pendingActionId === item.id) return;

    setError('');
    setNotice('');
    try {
      setPendingActionId(item.id);
      await catalogAdminApi.deleteCategory(item.id);
      if (editId === item.id) {
        navigate('/admin/categorias', { replace: true });
      }
      setNotice('Categoria eliminada.');
      await loadCategories();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar la categoria.');
    } finally {
      setPendingActionId((current) => (current === item.id ? null : current));
    }
  }

  return (
    <PageShell context="admin" className="space-y-5">
      <PageHeader
        context="admin"
        eyebrow="Catalogo"
        title="Categorias"
        subtitle="Organiza el catalogo de tienda con categorias limpias, activas y faciles de administrar."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/productos">Volver a productos</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/admin/categorias/crear">Nueva categoria</Link>
            </Button>
          </>
        }
      />

      <AdminCategoriesStatsGrid stats={stats} />
      <AdminCategoriesAlerts error={error} notice={notice} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.95fr)]">
        <div className="space-y-5">
          <AdminCategoriesFilters
            query={query}
            visibleCount={filteredItems.length}
            onQueryChange={setQuery}
          />

          <AdminCategoriesListSection
            loading={loading}
            items={filteredItems}
            allItemsCount={stats.total}
            editId={editId}
            pendingActionId={pendingActionId}
            onToggleActive={(item) => void toggleActive(item)}
            onRemove={(item) => void removeCategory(item)}
          />
        </div>

        <AdminCategoriesFormSection
          editId={editId}
          editingItem={editingItem}
          draft={draft}
          slugAuto={slugAuto}
          saving={saving}
          hasChanges={hasChanges}
          onNameChange={onNameChange}
          onSlugChange={(value) => {
            setSlug(value);
            setSlugAuto(false);
          }}
          onActiveChange={setActive}
          onSubmit={onSubmit}
          onClear={clearForm}
        />
      </div>
    </PageShell>
  );
}
