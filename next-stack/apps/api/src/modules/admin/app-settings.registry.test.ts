import type { AppSetting } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  getAppSettingDefinition,
  mergeDefinedAndStoredAppSettings,
  BRAND_ASSET_SLOTS,
} from './app-settings.registry.js';

function makeSetting(overrides: Partial<AppSetting>): AppSetting {
  const now = new Date('2026-03-30T12:00:00.000Z');
  return {
    id: 'setting-id',
    key: 'business_name',
    value: 'Stored Value',
    group: 'business',
    label: 'Nombre del negocio',
    type: 'text',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('app-settings.registry', () => {
  it('exposes typed definitions for known settings and brand assets', () => {
    expect(getAppSettingDefinition('business_name')?.owner).toBe('business');
    expect(BRAND_ASSET_SLOTS.logo_principal.fileBase).toBe('logo-principal');
    expect(BRAND_ASSET_SLOTS.auth_login_background.fileBase).toBe('auth-login-background');
    expect(BRAND_ASSET_SLOTS.auth_login_background_mobile.fileBase).toBe('auth-login-background-mobile');
  });

  it('merges defined settings with stored rows and keeps custom extras', () => {
    const merged = mergeDefinedAndStoredAppSettings([
      makeSetting({ key: 'business_name', value: 'Nico Repair Lab' }),
      makeSetting({
        id: 'custom-id',
        key: 'custom_runtime_flag',
        value: 'enabled',
        group: 'custom',
        label: undefined as any,
        type: undefined as any,
      }),
    ]);

    expect(merged.find((item) => item.key === 'business_name')?.value).toBe('Nico Repair Lab');
    expect(merged.find((item) => item.key === 'custom_runtime_flag')).toMatchObject({
      id: 'custom-id',
      value: 'enabled',
      group: 'custom',
      label: 'custom_runtime_flag',
      type: 'text',
    });
  });
});
