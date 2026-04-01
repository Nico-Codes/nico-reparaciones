import { type ReactNode } from 'react';
import { RefreshCcw, Search, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import type { AdminUserRow } from './usersApi';
import {
  ADMIN_USER_ROLE_FILTER_OPTIONS,
  ADMIN_USER_ROW_ROLE_OPTIONS,
  type AdminUsersStats,
} from './admin-users.helpers';

type AdminUsersHeaderProps = {
  total: number;
};

type AdminUsersStatsSectionProps = {
  stats: AdminUsersStats;
};

type AdminUsersFiltersProps = {
  q: string;
  roleFilter: string;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onReload: () => void;
};

type AdminUsersFeedbackProps = {
  error: string;
  message: string;
};

type AdminUsersListSectionProps = {
  items: AdminUserRow[];
  loading: boolean;
  error: string;
  message: string;
  currentUserId?: string;
  pendingUserIds: string[];
  onRoleChange: (userId: string, role: 'USER' | 'ADMIN') => void;
  onResetFilters: () => void;
};

export function AdminUsersHeader({ total }: AdminUsersHeaderProps) {
  return (
    <PageHeader
      context="admin"
      eyebrow="Accesos"
      title="Usuarios"
      subtitle="Gestiona roles, verificacion de correo y accesos al panel desde una unica vista operativa."
      actions={
        <>
          <StatusBadge tone="info" label={`${total} listados`} />
          <Button asChild variant="outline" size="sm">
            <Link to="/admin">Volver al panel</Link>
          </Button>
        </>
      }
    />
  );
}

export function AdminUsersStatsSection({ stats }: AdminUsersStatsSectionProps) {
  return (
    <section className="nr-stat-grid" data-reveal>
      <MetricCard
        label="Usuarios"
        value={String(stats.total)}
        meta="Cuentas visibles en la busqueda actual"
        icon={<Users className="h-4 w-4" />}
      />
      <MetricCard
        label="Admins"
        value={String(stats.admins)}
        meta="Cuentas con permisos de administracion"
        icon={<ShieldCheck className="h-4 w-4" />}
      />
      <MetricCard
        label="Correos verificados"
        value={String(stats.verified)}
        meta="Usuarios con email confirmado"
        icon={<RefreshCcw className="h-4 w-4" />}
      />
    </section>
  );
}

export function AdminUsersFilters({
  q,
  roleFilter,
  loading,
  onSearchChange,
  onRoleFilterChange,
  onReload,
}: AdminUsersFiltersProps) {
  return (
    <FilterBar
      actions={
        <Button type="button" variant="outline" size="sm" onClick={onReload} disabled={loading}>
          <RefreshCcw className="h-4 w-4" />
          Actualizar
        </Button>
      }
    >
      <TextField
        value={q}
        onChange={(event) => onSearchChange(event.target.value)}
        label="Buscar"
        placeholder="Nombre o email"
        leadingIcon={<Search className="h-4 w-4" />}
        wrapperClassName="min-w-0 sm:min-w-[20rem]"
      />
      <div className="ui-field min-w-0 sm:min-w-[12rem]">
        <span className="ui-field__label">Rol</span>
        <CustomSelect
          value={roleFilter}
          onChange={onRoleFilterChange}
          options={ADMIN_USER_ROLE_FILTER_OPTIONS}
          triggerClassName="min-h-11 rounded-[1rem]"
          ariaLabel="Filtrar por rol"
        />
      </div>
    </FilterBar>
  );
}

export function AdminUsersFeedback({ error, message }: AdminUsersFeedbackProps) {
  return (
    <>
      {error ? (
        <div className="ui-alert ui-alert--danger mb-4">
          <div>
            <span className="ui-alert__title">No pudimos actualizar la lista.</span>
            <div className="ui-alert__text">{error}</div>
          </div>
        </div>
      ) : null}
      {message ? (
        <div className="ui-alert ui-alert--success mb-4">
          <div>
            <span className="ui-alert__title">Cambio aplicado</span>
            <div className="ui-alert__text">{message}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function AdminUsersListSection({
  items,
  loading,
  error,
  message,
  currentUserId,
  pendingUserIds,
  onRoleChange,
  onResetFilters,
}: AdminUsersListSectionProps) {
  return (
    <SectionCard
      title="Accesos del panel"
      description="Revisa el estado de verificacion y actualiza roles sin perder el contexto de busqueda."
      actions={
        <StatusBadge tone={loading ? 'warning' : 'neutral'} size="sm" label={loading ? 'Actualizando' : 'Sincronizado'} />
      }
    >
      <AdminUsersFeedback error={error} message={message} />

      {loading ? (
        <LoadingBlock label="Cargando usuarios" lines={4} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No hay usuarios para mostrar"
          description="Proba con otro termino de busqueda o quita el filtro de rol."
          actions={
            <Button type="button" variant="outline" onClick={onResetFilters}>
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <div className="admin-collection">
          {items.map((user) => {
            const isSelf = currentUserId === user.id;
            const isPending = pendingUserIds.includes(user.id);
            return (
              <article key={user.id} className="admin-entity-row">
                <div className="admin-entity-row__top">
                  <div className="admin-entity-row__heading">
                    <div className="admin-entity-row__title-row">
                      <div className="admin-entity-row__title">{user.name}</div>
                      {isSelf ? <StatusBadge tone="accent" size="sm" label="Tu cuenta" /> : null}
                      <StatusBadge
                        tone={user.emailVerified ? 'success' : 'warning'}
                        size="sm"
                        label={user.emailVerified ? 'Verificado' : 'Pendiente de verificacion'}
                      />
                      <StatusBadge
                        tone={user.role === 'ADMIN' ? 'info' : 'neutral'}
                        size="sm"
                        label={user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
                      />
                    </div>
                    <div className="admin-entity-row__meta">
                      <span>{user.email}</span>
                      <span>Alta: {new Date(user.createdAt).toLocaleDateString('es-AR')}</span>
                      <span>Ultima actualizacion: {new Date(user.updatedAt).toLocaleDateString('es-AR')}</span>
                      {isSelf ? <span>No podes cambiar tu propio rol desde esta pantalla.</span> : null}
                    </div>
                  </div>
                  <div className="admin-entity-row__aside">
                    <span className="admin-entity-row__eyebrow">Rol</span>
                    <div className="min-w-[12rem]" title={isSelf ? 'No podes cambiar tu propio rol desde esta pantalla.' : undefined}>
                      <CustomSelect
                        value={user.role}
                        onChange={(nextRole) => onRoleChange(user.id, nextRole as 'USER' | 'ADMIN')}
                        options={ADMIN_USER_ROW_ROLE_OPTIONS}
                        disabled={isPending || isSelf}
                        triggerClassName="min-h-10 rounded-xl"
                        ariaLabel={`Rol de ${user.name}`}
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function MetricCard({
  label,
  value,
  meta,
  icon,
}: {
  label: string;
  value: string;
  meta: string;
  icon: ReactNode;
}) {
  return (
    <article className="nr-stat-card">
      <div className="nr-stat-card__label flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className="nr-stat-card__value">{value}</div>
      <div className="nr-stat-card__meta">{meta}</div>
    </article>
  );
}
