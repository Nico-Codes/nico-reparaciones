import { describe, expect, it } from 'vitest';
import {
  appSettingsResponseSchema,
  loginSchema,
  orderStatusSchema,
  repairStatusSchema,
} from './index';

describe('@nico/contracts', () => {
  it('parses authentication and settings payloads with canonical schemas', () => {
    const login = loginSchema.parse({
      email: 'admin@example.com',
      password: 'supersecret123',
      twoFactorCode: '123456',
    });
    const settings = appSettingsResponseSchema.parse({
      items: [
        {
          id: 'setting-id',
          key: 'business_name',
          value: 'NicoReparaciones',
          group: 'business',
          label: 'Nombre del negocio',
          type: 'text',
          createdAt: '2026-03-30T12:00:00.000Z',
          updatedAt: '2026-03-30T12:00:00.000Z',
        },
      ],
    });

    expect(login.twoFactorCode).toBe('123456');
    expect(settings.items[0]?.key).toBe('business_name');
  });

  it('keeps order and repair statuses aligned with canonical enums', () => {
    expect(orderStatusSchema.parse('CONFIRMADO')).toBe('CONFIRMADO');
    expect(repairStatusSchema.parse('READY_PICKUP')).toBe('READY_PICKUP');
    expect(() => orderStatusSchema.parse('DESCONOCIDO')).toThrow();
    expect(() => repairStatusSchema.parse('UNKNOWN')).toThrow();
  });
});
