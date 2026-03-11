import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCcw, Search, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { authStorage } from '@/features/auth/storage';
import { adminUsersApi, type AdminUserRow } from './usersApi';

export function AdminUsersPage() {
  const currentUser = authStorage.getUser();
  const [items, setItems] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pendingUserIds, setPendingUserIds] = useState<string[]>([]);
  const requestIdRef = useRef(0);

  async function load() {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError('');
    try {
      const response = await adminUsersApi.list({ q, role: roleFilter || undefined });
      if (requestId !== requestIdRef.current) return;
      setItems(response.items);
    } catch (cause) {
      if (requestId !== requestIdRef.current) return;
      setError(cause instanceof Error ? cause.message : 'No pudimos cargar los usuarios.');
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }

  useEffect(() => {
    setMessage('');
    void load();
  }, [q, roleFilter]);

  async function changeRole(userId: string, role: 'USER' | 'ADMIN') {
    if (pendingUserIds.includes(userId)) return;
    if (currentUser?.id === userId) {
      setError('No podes cambiar tu propio rol desde esta pantalla.');
      return;
    }

    setError('');
    setMessage('');
    try {
      setPendingUserIds((current) => [...current, userId]);
      const response = await adminUsersApi.updateRole(userId, role);
      if (response.message && !response.item) {
        setError(response.message);
        return;
      }
      if (response.item) {
        setItems((current) => current.map((user) => (user.id === userId ? response.item! : user)));
        setMessage(`Rol actualizado para ${response.item.name}.`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos actualizar el rol.');
    } finally {
      setPendingUserIds((current) => current.filter((currentId) => currentId !== userId));
    }
  }

  const stats = useMemo(
    () => ({
      total: items.length,
      admins: items.filter((user) => user.role === 'ADMIN').length,
      verified: items.filter((user) => user.emailVerified).length,
    }),
    [items],
  );

  const roleOptions = [
    { value: '', label: 'Todos los roles' },
    { value: 'ADMIN', label: 'Administradores' },
    { value: 'USER', label: 'Usuarios' },
  ];
  const rowRoleOptions = [
    { value: 'USER', label: 'Usuario' },
    { value: 'ADMIN', label: 'Administrador' },
  ];

  return (
    <PageShell context="admin" className="space-y-6" data-admin-users-page>
      <PageHeader
        context="admin"
        eyebrow="Accesos"
        title="Usuarios"
        subtitle="Gestiona roles, verificacion de correo y accesos al panel desde una unica vista operativa."
        actions={
          <>
            <StatusBadge tone="info" label={`${stats.total} listados`} />
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">Volver al panel</Link>
            </Button>
          </>
        }
      />

      <section className="nr-stat-grid" data-reveal>
        <MetricCard label="Usuarios" value={String(stats.total)} meta="Cuentas visibles en la busqueda actual" icon={<Users className="h-4 w-4" />} />
        <MetricCard label="Admins" value={String(stats.admins)} meta="Cuentas con permisos de administracion" icon={<ShieldCheck className="h-4 w-4" />} />
        <MetricCard label="Correos verificados" value={String(stats.verified)} meta="Usuarios con email confirmado" icon={<RefreshCcw className="h-4 w-4" />} />
      </section>

      <FilterBar
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCcw className="h-4 w-4" />
            Actualizar
          </Button>
        }
      >
        <TextField
          value={q}
          onChange={(event) => setQ(event.target.value)}
          label="Buscar"
          placeholder="Nombre o email"
          leadingIcon={<Search className="h-4 w-4" />}
          wrapperClassName="min-w-0 sm:min-w-[20rem]"
        />
        <div className="ui-field min-w-0 sm:min-w-[12rem]">
          <span className="ui-field__label">Rol</span>
          <CustomSelect
            value={roleFilter}
            onChange={setRoleFilter}
            options={roleOptions}
            triggerClassName="min-h-11 rounded-[1rem]"
            ariaLabel="Filtrar por rol"
          />
        </div>
      </FilterBar>

      <SectionCard
        title="Accesos del panel"
        description="Revisa el estado de verificacion y actualiza roles sin perder el contexto de busqueda."
        actions={<StatusBadge tone={loading ? 'warning' : 'neutral'} size="sm" label={loading ? 'Actualizando' : 'Sincronizado'} />}
      >
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

        {loading ? (
          <LoadingBlock label="Cargando usuarios" lines={4} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No hay usuarios para mostrar"
            description="Proba con otro termino de busqueda o quita el filtro de rol."
            actions={
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQ('');
                  setRoleFilter('');
                }}
              >
                Limpiar filtros
              </Button>
            }
          />
        ) : (
          <div className="admin-collection">
            {items.map((user) => {
              const isSelf = currentUser?.id === user.id;
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
                        <StatusBadge tone={user.role === 'ADMIN' ? 'info' : 'neutral'} size="sm" label={user.role === 'ADMIN' ? 'Administrador' : 'Usuario'} />
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
                          onChange={(nextRole) => void changeRole(user.id, nextRole as 'USER' | 'ADMIN')}
                          options={rowRoleOptions}
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
    </PageShell>
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



