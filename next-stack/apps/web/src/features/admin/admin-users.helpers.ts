import type { AdminUserRow } from './usersApi';

export type AdminUsersStats = {
  total: number;
  admins: number;
  verified: number;
};

export const ADMIN_USER_ROLE_FILTER_OPTIONS = [
  { value: '', label: 'Todos los roles' },
  { value: 'ADMIN', label: 'Administradores' },
  { value: 'USER', label: 'Usuarios' },
];

export const ADMIN_USER_ROW_ROLE_OPTIONS = [
  { value: 'USER', label: 'Usuario' },
  { value: 'ADMIN', label: 'Administrador' },
];

export function buildAdminUsersStats(items: AdminUserRow[]): AdminUsersStats {
  return {
    total: items.length,
    admins: items.filter((user) => user.role === 'ADMIN').length,
    verified: items.filter((user) => user.emailVerified).length,
  };
}

export function resolveAdminUsersLoadError(cause: unknown) {
  return cause instanceof Error ? cause.message : 'No pudimos cargar los usuarios.';
}

export function resolveAdminUsersUpdateError(cause: unknown) {
  return cause instanceof Error ? cause.message : 'No pudimos actualizar el rol.';
}

export function canManageAdminUserRole(currentUserId: string | undefined, userId: string, pendingUserIds: string[]) {
  return currentUserId !== userId && !pendingUserIds.includes(userId);
}

export function resolveAdminUsersSelfRoleError() {
  return 'No podes cambiar tu propio rol desde esta pantalla.';
}
