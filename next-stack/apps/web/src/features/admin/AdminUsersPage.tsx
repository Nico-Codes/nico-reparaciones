import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
        setItems((prev) => prev.map((u) => (u.id === userId ? res.item! : u)));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error actualizando rol');
    }
  }

  const stats = useMemo(() => ({
    total: items.length,
    admins: items.filter((u) => u.role === 'ADMIN').length,
    verified: items.filter((u) => u.emailVerified).length,
  }), [items]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Admin Usuarios (Next)</h1>
            <p className="mt-1 text-sm text-zinc-600">Listado de usuarios y cambio de roles (USER/ADMIN).</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/admin">Volver a admin</Link>
          </Button>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Stat label="Usuarios listados" value={String(stats.total)} />
          <Stat label="Admins" value={String(stats.admins)} />
          <Stat label="Emails verificados" value={String(stats.verified)} />
        </div>

        <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-3 grid gap-2 md:grid-cols-[1fr_180px_auto]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
            />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm">
              <option value="">Todos los roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="USER">USER</option>
            </select>
            <Button variant="outline" onClick={() => void load()}>Actualizar</Button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-zinc-200 p-3 text-sm">Cargando usuarios...</div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 p-3 text-sm">No hay usuarios.</div>
          ) : (
            <div className="space-y-2">
              {items.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <div key={u.id} className="rounded-xl border border-zinc-200 p-3">
                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-sm font-black text-zinc-900">{u.name}</div>
                          {isSelf ? <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-700">Vos</span> : null}
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${u.emailVerified ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                            {u.emailVerified ? 'Verificado' : 'Sin verificar'}
                          </span>
                        </div>
                        <div className="truncate text-sm text-zinc-600">{u.email}</div>
                        <div className="mt-1 text-xs text-zinc-500">Alta: {new Date(u.createdAt).toLocaleString('es-AR')}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={u.role}
                          onChange={(e) => void changeRole(u.id, e.target.value as 'USER' | 'ADMIN')}
                          className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
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

