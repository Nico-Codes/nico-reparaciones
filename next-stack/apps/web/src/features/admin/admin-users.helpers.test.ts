import { describe, expect, it } from 'vitest';
import { buildAdminUsersStats, canManageAdminUserRole, resolveAdminUsersSelfRoleError } from './admin-users.helpers';

describe('admin-users.helpers', () => {
  it('calcula metricas del listado', () => {
    const stats = buildAdminUsersStats([
      { role: 'ADMIN', emailVerified: true },
      { role: 'USER', emailVerified: false },
      { role: 'ADMIN', emailVerified: true },
    ] as never);

    expect(stats).toEqual({ total: 3, admins: 2, verified: 2 });
  });

  it('bloquea cambio de rol para cuenta propia o pending', () => {
    expect(canManageAdminUserRole('1', '1', [])).toBe(false);
    expect(canManageAdminUserRole('1', '2', ['2'])).toBe(false);
    expect(canManageAdminUserRole('1', '2', [])).toBe(true);
  });

  it('mantiene el mensaje fijo para self role', () => {
    expect(resolveAdminUsersSelfRoleError()).toContain('propio rol');
  });
});
