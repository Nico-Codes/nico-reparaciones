import { describe, expect, it } from 'vitest';
import {
  acceptFromFormats,
  AUTH_VISUAL_ASSETS,
  FAVICON_ASSETS,
  resolveAssetState,
  summarizeAssetPath,
} from './admin-visual-identity.helpers';
import type { AdminSettingItem } from './settingsApi';

function makeSetting(input: Partial<AdminSettingItem> & Pick<AdminSettingItem, 'key' | 'value' | 'group' | 'type'>): AdminSettingItem {
  return {
    id: null,
    label: null,
    createdAt: null,
    updatedAt: null,
    ...input,
  };
}

describe('admin-visual-identity.helpers', () => {
  it('resolves effective asset path and display label', () => {
    const item = FAVICON_ASSETS[0];
    const settingsByKey = new Map<string, AdminSettingItem>([
      [item.settingKey, makeSetting({ key: item.settingKey, value: 'brand-assets/custom/favicon.ico', group: 'branding', type: 'text' })],
    ]);

    expect(resolveAssetState(item, settingsByKey)).toEqual({
      isCustom: true,
      effectivePath: 'brand-assets/custom/favicon.ico',
      displayPath: 'custom/favicon.ico',
    });
  });

  it('falls back to default filename when asset is not customized', () => {
    const item = FAVICON_ASSETS[1];

    expect(resolveAssetState(item, new Map())).toEqual({
      isCustom: false,
      effectivePath: item.defaultPath,
      displayPath: item.filename,
    });
  });

  it('falls back to the default auth background when no custom auth asset exists', () => {
    const item = AUTH_VISUAL_ASSETS[0];

    expect(resolveAssetState(item, new Map())).toEqual({
      isCustom: false,
      effectivePath: 'brand/logo-bg.png',
      displayPath: item.filename,
    });
  });

  it('summarizes asset path and builds accept list', () => {
    expect(summarizeAssetPath('icons/settings.svg')).toBe('icons/settings.svg');
    expect(summarizeAssetPath('')).toBe('');
    expect(acceptFromFormats('PNG, JPG, SVG')).toBe('.png,.jpg,.svg');
    expect(acceptFromFormats('ICO')).toBe('.ico');
  });

  it('exposes the auth visual asset in the branding catalog', () => {
    expect(AUTH_VISUAL_ASSETS[0]).toMatchObject({
      slot: 'auth_login_background',
      settingKey: 'brand_asset.auth_login_background.path',
      defaultPath: 'brand/logo-bg.png',
      recommendedPx: '1800 x 1400 px o mayor',
    });
    expect(AUTH_VISUAL_ASSETS[1]).toMatchObject({
      slot: 'auth_login_background_mobile',
      settingKey: 'brand_asset.auth_login_background_mobile.path',
      defaultPath: 'brand/logo-bg.png',
      recommendedPx: '1080 x 720 px o mayor',
    });
  });
});
