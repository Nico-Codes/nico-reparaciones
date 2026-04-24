import type { FormEvent } from 'react';
import { FolderTree, Layers3, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { LoadingBlock } from '@/components/ui/loading-block';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { cn } from '@/lib/utils';
import type { ProductSelectOption } from './admin-product-form.helpers';
import { getCategoryTone, type AdminCategoryDraft, type AdminCategoryStats } from './admin-categories.helpers';
import type { AdminCategory } from './api';

type AdminCategoriesStatsGridProps = {
  stats: AdminCategoryStats;
};

type AdminCategoriesAlertsProps = {
  error: string;
  notice: string;
};

type AdminCategoriesFiltersProps = {
  query: string;
  visibleCount: number;
  onQueryChange: (value: string) => void;
};

type AdminCategoriesListSectionProps = {
  loading: boolean;
  items: AdminCategory[];
  allItemsCount: number;
  editId: string | null;
  pendingActionId: string | null;
  onToggleActive: (item: AdminCategory) => void;
  onRemove: (item: AdminCategory) => void;
};

type AdminCategoriesFormSectionProps = {
  editId: string | null;
  editingItem: AdminCategory | null;
  draft: AdminCategoryDraft;
  parentOptions: ProductSelectOption[];
  slugAuto: boolean;
  saving: boolean;
  hasChanges: boolean;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onParentChange: (value: string) => void;
  onActiveChange: (value: boolean) => void;
  onSubmit: (event: FormEvent) => void;
  onClear: () => void;
};

export function AdminCategoriesStatsGrid({ stats }: AdminCategoriesStatsGridProps) {
  return (
    <div className="nr-stat-grid">
      <div className="nr-stat-card">
        <div className="nr-stat-card__label">Categorias</div>
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
      <div className="nr-stat-card">
        <div className="nr-stat-card__label">Padres</div>
        <div className="nr-stat-card__value">{stats.parents}</div>
        <div className="nr-stat-card__meta">Categorias raiz del catalogo.</div>
      </div>
      <div className="nr-stat-card">
        <div className="nr-stat-card__label">Subcategorias</div>
        <div className="nr-stat-card__value">{stats.children}</div>
        <div className="nr-stat-card__meta">Categorias hijas de un nivel.</div>
      </div>
    </div>
  );
}

export function AdminCategoriesAlerts({ error, notice }: AdminCategoriesAlertsProps) {
  return (
    <>
      {error ? (
        <div className="ui-alert ui-alert--danger" data-reveal>
          <FolderTree className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No se pudo completar la accion</span>
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
    </>
  );
}

export function AdminCategoriesFilters({
  query,
  visibleCount,
  onQueryChange,
}: AdminCategoriesFiltersProps) {
  return (
    <FilterBar actions={<StatusBadge label={`${visibleCount} visibles`} tone="info" />}>
      <TextField
        label="Buscar"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Ej: fundas, cargadores, audio..."
        wrapperClassName="min-w-[16rem] flex-1"
      />
    </FilterBar>
  );
}

export function AdminCategoriesListSection({
  loading,
  items,
  allItemsCount,
  editId,
  pendingActionId,
  onToggleActive,
  onRemove,
}: AdminCategoriesListSectionProps) {
  return (
    <SectionCard
      title="Listado"
      description="Revisa el estado, el slug y la cantidad de productos asociados de cada categoria."
      actions={<StatusBadge label={`${allItemsCount} registradas`} tone="neutral" size="sm" />}
    >
      {loading ? (
        <LoadingBlock label="Cargando categorias" lines={5} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Layers3 className="h-5 w-5" />}
          title={allItemsCount === 0 ? 'Todavia no hay categorias' : 'No encontramos coincidencias'}
          description={
            allItemsCount === 0
              ? 'Crea la primera categoria para organizar mejor el catalogo de productos.'
              : 'Proba con otro nombre o limpia la busqueda para ver todas las categorias.'
          }
          actions={
            allItemsCount === 0 ? (
              <Button asChild>
                <Link to="/admin/categorias/crear">Crear categoria</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className={cn('admin-entity-row', editId === item.id && 'is-active', item.depth > 0 && 'ml-4')}>
              <div className="admin-entity-row__top">
                <div className="admin-entity-row__heading">
                  <div className="admin-entity-row__title-row">
                    <Link to={`/admin/categorias/${encodeURIComponent(item.id)}/editar`} className="admin-entity-row__title">
                      {item.depth > 0 ? `↳ ${item.name}` : item.name}
                    </Link>
                    <StatusBadge label={item.active ? 'Activa' : 'Inactiva'} tone={getCategoryTone(item.active)} size="sm" />
                    {item.depth > 0 ? <StatusBadge label="Subcategoria" tone="accent" size="sm" /> : <StatusBadge label="Padre" tone="info" size="sm" />}
                  </div>
                  <div className="admin-entity-row__meta">
                    <span>Slug: /{item.slug}</span>
                    <span>{item.pathLabel}</span>
                    <span>{item.directProductsCount} directos</span>
                    <span>{item.totalProductsCount} totales</span>
                    {item.childrenCount > 0 ? <span>{item.childrenCount} subcategorias</span> : null}
                  </div>
                </div>

                <div className="admin-entity-row__aside">
                  <span className="admin-entity-row__eyebrow">Productos totales</span>
                  <div className="admin-entity-row__value">{item.totalProductsCount}</div>
                </div>
              </div>

              <div className="admin-entity-row__actions">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/admin/categorias/${encodeURIComponent(item.id)}/editar`}>Editar</Link>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onToggleActive(item)}
                  disabled={pendingActionId === item.id}
                >
                  {pendingActionId === item.id ? 'Guardando...' : item.active ? 'Desactivar' : 'Activar'}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => onRemove(item)}
                  disabled={item.directProductsCount > 0 || item.childrenCount > 0 || pendingActionId === item.id}
                  title={
                    item.directProductsCount > 0
                      ? 'No se puede eliminar mientras tenga productos directos asociados.'
                      : item.childrenCount > 0
                        ? 'No se puede eliminar mientras tenga subcategorias.'
                        : 'Eliminar categoria'
                  }
                >
                  {pendingActionId === item.id ? 'Procesando...' : 'Eliminar'}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function AdminCategoriesFormSection({
  editId,
  editingItem,
  draft,
  parentOptions,
  slugAuto,
  saving,
  hasChanges,
  onNameChange,
  onSlugChange,
  onParentChange,
  onActiveChange,
  onSubmit,
  onClear,
}: AdminCategoriesFormSectionProps) {
  return (
    <SectionCard
      title={editId && editingItem ? 'Editar categoria' : 'Nueva categoria'}
      description={
        editId && editingItem
          ? 'Actualiza nombre, slug y estado sin salir del catalogo.'
          : 'Crea una categoria clara y consistente para organizar productos.'
      }
      actions={
        editId && editingItem ? (
          <StatusBadge label="Edicion" tone="accent" size="sm" />
        ) : (
          <StatusBadge label="Alta" tone="info" size="sm" />
        )
      }
    >
      {editId && !editingItem ? (
        <EmptyState
          icon={<Tag className="h-5 w-5" />}
          title="La categoria seleccionada no existe"
          description="Volve al listado para elegir otra categoria o crea una nueva desde cero."
          actions={
            <Button asChild>
              <Link to="/admin/categorias/crear">Crear categoria</Link>
            </Button>
          }
        />
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <TextField
            label="Nombre"
            value={draft.name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Ej: Fundas"
            required
          />

          <TextField
            label="Slug"
            value={draft.slug}
            onChange={(event) => onSlugChange(event.target.value)}
            placeholder="fundas"
            hint={
              slugAuto
                ? 'Se genera automaticamente a partir del nombre.'
                : 'Podes editarlo manualmente si necesitas una URL especifica.'
            }
            required
          />

          <label className="ui-field">
            <span className="ui-field__label">Categoria padre</span>
            <span className="ui-field__control">
              <select
                className="ui-input"
                value={draft.parentId}
                onChange={(event) => onParentChange(event.target.value)}
                disabled={saving}
              >
                {parentOptions.map((option) => (
                  <option key={option.value || '__root__'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </span>
            <span className="ui-field__hint">Si eliges una padre, esta categoria pasa a ser subcategoria.</span>
          </label>

          <div className="space-y-2">
            <div className="ui-field__label">Estado</div>
            <div className="choice-grid">
              <button
                type="button"
                className={cn('choice-card', draft.active && 'is-active')}
                onClick={() => onActiveChange(true)}
                disabled={saving}
              >
                <div className="choice-card__title">Activa</div>
                <div className="choice-card__hint">Disponible para productos visibles en tienda.</div>
              </button>
              <button
                type="button"
                className={cn('choice-card', !draft.active && 'is-active')}
                onClick={() => onActiveChange(false)}
                disabled={saving}
              >
                <div className="choice-card__title">Inactiva</div>
                <div className="choice-card__hint">Se conserva en el catalogo, pero deja de ofrecerse.</div>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" disabled={saving || (Boolean(editId && editingItem) && !hasChanges)}>
              {saving ? 'Guardando...' : editId && editingItem ? 'Guardar cambios' : 'Crear categoria'}
            </Button>
            <Button type="button" variant="outline" disabled={saving} onClick={onClear}>
              Limpiar
            </Button>
          </div>
        </form>
      )}
    </SectionCard>
  );
}
