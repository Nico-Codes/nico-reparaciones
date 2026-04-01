import { useEffect, useMemo, useRef, useState } from 'react';
import { PageShell } from '@/components/ui/page-shell';
import { authStorage } from '@/features/auth/storage';
import {
  buildAdminUsersStats,
  resolveAdminUsersLoadError,
  resolveAdminUsersSelfRoleError,
  resolveAdminUsersUpdateError,
} from './admin-users.helpers';
import {
  AdminUsersFilters,
  AdminUsersHeader,
  AdminUsersListSection,
  AdminUsersStatsSection,
} from './admin-users.sections';
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
      setError(resolveAdminUsersLoadError(cause));
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
      setError(resolveAdminUsersSelfRoleError());
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
      setError(resolveAdminUsersUpdateError(cause));
    } finally {
      setPendingUserIds((current) => current.filter((currentId) => currentId !== userId));
    }
  }

  const stats = useMemo(() => buildAdminUsersStats(items), [items]);

  return (
    <PageShell context="admin" className="space-y-6" data-admin-users-page>
      <AdminUsersHeader total={stats.total} />
      <AdminUsersStatsSection stats={stats} />
      <AdminUsersFilters
        q={q}
        roleFilter={roleFilter}
        loading={loading}
        onSearchChange={setQ}
        onRoleFilterChange={setRoleFilter}
        onReload={() => void load()}
      />
      <AdminUsersListSection
        items={items}
        loading={loading}
        error={error}
        message={message}
        currentUserId={currentUser?.id}
        pendingUserIds={pendingUserIds}
        onRoleChange={(userId, role) => void changeRole(userId, role)}
        onResetFilters={() => {
          setQ('');
          setRoleFilter('');
        }}
      />
    </PageShell>
  );
}
