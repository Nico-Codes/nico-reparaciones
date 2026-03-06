import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import { authStorage } from '@/features/auth/storage';
import { adminUsersApi, type AdminUserRow } from './usersApi';

export function AdminUsersPage() {
  const currentUser = authStorage.getUser();
  const [items, setItems] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await adminUsersApi.list({ q, role: roleFilter || undefined });
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [q, roleFilter]);

  async function changeRole(userId: string, role: 'USER' | 'ADMIN') {
    try {
      const res = await adminUsersApi.updateRole(userId, role);
      if (res.message && !res.item) {
        setError(res.message);
        return;
      }
      if (res.item) {
        setItems((prev) => prev.map((user) => (user.id === userId ? res.item! : user)));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error actualizando rol');
    }
  }

  const stats = useMemo(() => ({
    total: items.length,
    admins: items.filter((user) => user.role === 'ADMIN').length,
    verified: items.filter((user) => user.emailVerified).length,
  }), [items]);

  const roleOptions = [
    { value: '', label: 'Todos los roles' },
    { value: 'ADMIN', label: 'ADMIN' },
    { value: 'USER', label: 'USER' },
  ];
  const rowRoleOptions = [
    { value: 'USER', label: 'USER' },
    { value: 'ADMIN', label: 'ADMIN' },
  ];

  return (
    <div className="store-shell">
      <div className="page-head store-hero">
        <div>
          <div className="page-title">Usuarios</div>
          <div className="page-subtitle">Listado de usuarios y cambio de roles (USER/ADMIN).</div>
        </div>
        <Link to="/admin" className="btn-outline h-11 w-full justify-center sm:w-auto">Volver a admin</Link>
      </div>

      {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Stat label="Usuarios listados" value={String(stats.total)} />
        <Stat label="Admins" value={String(stats.admins)} />
        <Stat label="Emails verificados" value={String(stats.verified)} />
      </div>

      <section className="mt-4 card">
        <div className="card-body p-4">
          <div className="mb-3 grid gap-2 md:grid-cols-[1fr_180px_auto]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
            />
            <CustomSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={roleOptions}
              triggerClassName="min-h-10 rounded-xl"
              ariaLabel="Filtrar por rol"
            />
            <button className="btn-outline h-10 justify-center px-4" type="button" onClick={() => void load()}>Actualizar</button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-zinc-200 p-3 text-sm">Cargando usuarios...</div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 p-3 text-sm">No hay usuarios.</div>
          ) : (
            <div className="space-y-2">
              {items.map((user) => {
                const isSelf = currentUser?.id === user.id;
                return (
                  <div key={user.id} className="rounded-xl border border-zinc-200 p-3">
                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-sm font-black text-zinc-900">{user.name}</div>
                          {isSelf ? <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-700">Vos</span> : null}
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${user.emailVerified ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                            {user.emailVerified ? 'Verificado' : 'Sin verificar'}
                          </span>
                        </div>
                        <div className="truncate text-sm text-zinc-600">{user.email}</div>
                        <div className="mt-1 text-xs text-zinc-500">Alta: {new Date(user.createdAt).toLocaleString('es-AR')}</div>
                      </div>
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <CustomSelect
                          value={user.role}
                          onChange={(nextRole) => void changeRole(user.id, nextRole as 'USER' | 'ADMIN')}
                          options={rowRoleOptions}
                          triggerClassName="min-h-10 rounded-xl"
                          ariaLabel={`Rol de ${user.name}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-xl font-black text-zinc-900">{value}</div>
    </div>
  );
}
