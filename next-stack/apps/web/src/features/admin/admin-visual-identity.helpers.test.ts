import { describe, expect, it } from 'vitest';
import {
  acceptFromFormats,
  AUTH_VISUAL_ASSETS,
  buildAssetDownloadName,
  buildAuthVisualFormState,
  buildAuthVisualSettingsPayload,
  DEFAULT_AUTH_VISUAL_FORM_STATE,
  FAVICON_ASSETS,
  normalizeHexColor,
  patchAuthVisualSetting,
  resolveAssetState,
  summarizeAssetPath,
  VISUAL_IDENTITY_SECTIONS,
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
      updatedAt: null,
      displayPath: 'custom/favicon.ico',
    });
  });

  it('falls back to default filename when asset is not customized', () => {
    const item = FAVICON_ASSETS[1];

    expect(resolveAssetState(item, new Map())).toEqual({
      isCustom: false,
      effectivePath: item.defaultPath,
      updatedAt: null,
      displayPath: item.filename,
    });
  });

  it('falls back to the default auth background when no custom auth asset exists', () => {
    const item = AUTH_VISUAL_ASSETS[0];

    expect(resolveAssetState(item, new Map())).toEqual({
      isCustom: false,
      effectivePath: 'brand/logo-bg.png',
      updatedAt: null,
      displayPath: item.filename,
    });
  });

  it('treats a stored default path as non-custom after reset', () => {
    const item = AUTH_VISUAL_ASSETS[0];
    const settingsByKey = new Map<string, AdminSettingItem>([
      [
        item.settingKey,
        makeSetting({
          key: item.settingKey,
          value: item.defaultPath,
          group: 'branding',
          type: 'text',
          updatedAt: '2026-04-16T17:45:00.000Z',
        }),
      ],
    ]);

    expect(resolveAssetState(item, settingsByKey)).toEqual({
      isCustom: false,
      effectivePath: item.defaultPath,
      updatedAt: null,
      displayPath: item.filename,
    });
  });

  it('summarizes asset path and builds accept list', () => {
    expect(summarizeAssetPath('icons/settings.svg')).toBe('icons/settings.svg');
    expect(summarizeAssetPath('')).toBe('');
    expect(acceptFromFormats('PNG, JPG, SVG')).toBe('.png,.jpg,.svg');
    expect(acceptFromFormats('ICO')).toBe('.ico');
  });

  it('builds a download filename from the effective asset path', () => {
    const item = FAVICON_ASSETS[0];

    expect(buildAssetDownloadName(item, 'brand-assets/custom/favicon.ico?v=123')).toBe('favicon.ico');
    expect(buildAssetDownloadName(item, '')).toBe('favicon.ico');
  });

  it('exposes the auth visual asset in the branding catalog', () => {
    expect(AUTH_VISUAL_ASSETS[0]).toMatchObject({
      slot: 'auth_login_background',
      settingKey: 'brand_asset.auth_login_background.path',
      defaultPath: 'brand/logo-bg.png',
      recommendedPx: '9:7 - 1800 x 1400 px o mayor',
    });
    expect(AUTH_VISUAL_ASSETS[1]).toMatchObject({
      slot: 'auth_login_background_mobile',
      settingKey: 'brand_asset.auth_login_background_mobile.path',
      defaultPath: 'brand/logo-bg.png',
      recommendedPx: '3:2 - 1080 x 720 px o mayor',
    });
  });

  it('shows recommended proportions for every visual identity asset card', () => {
    const missingRecommendations = VISUAL_IDENTITY_SECTIONS.flatMap((section) =>
      section.items
        .filter((item) => !item.recommendedPx?.trim())
        .map((item) => `${section.title}: ${item.title}`),
    );

    expect(missingRecommendations).toEqual([]);
  });

  it('hydrates auth visual copy settings with defaults', () => {
    const form = buildAuthVisualFormState([
      makeSetting({ key: 'auth_panel_eyebrow', value: 'Bienvenido', group: 'branding', type: 'text' }),
      makeSetting({ key: 'auth_panel_text_color', value: 'abc123', group: 'branding', type: 'text' }),
    ]);

    expect(form).toEqual({
      ...DEFAULT_AUTH_VISUAL_FORM_STATE,
      eyebrow: 'Bienvenido',
      eyebrowColor: '#ABC123',
      titleColor: '#ABC123',
      descriptionColor: '#ABC123',
    });
  });

  it('builds auth visual payload preserving metadata', () => {
    const payload = buildAuthVisualSettingsPayload(
      new Map([
        [
          'auth_panel_title',
          makeSetting({ key: 'auth_panel_title', value: '', group: 'branding', type: 'textarea', label: 'Titulo actual' }),
        ],
      ]),
      {
        eyebrow: 'Cuenta',
        title: 'Orden total',
        description: 'Texto nuevo',
        eyebrowColor: '#112233',
        titleColor: '#334455',
        descriptionColor: '#556677',
      },
    );

    expect(payload.find((item) => item.key === 'auth_panel_title')).toEqual({
      key: 'auth_panel_title',
      value: 'Orden total',
      group: 'branding',
      label: 'Titulo actual',
      type: 'textarea',
    });
    expect(payload.find((item) => item.key === 'auth_panel_eyebrow_color')?.value).toBe('#112233');
    expect(payload.find((item) => item.key === 'auth_panel_title_color')?.value).toBe('#334455');
    expect(payload.find((item) => item.key === 'auth_panel_description_color')?.value).toBe('#556677');
  });

  it('patches and normalizes auth visual color values', () => {
    expect(normalizeHexColor('abc123')).toBe('#ABC123');
    expect(normalizeHexColor('zzz')).toBe('#FFFFFF');
    expect(
      patchAuthVisualSetting(undefined, 'auth_panel_eyebrow', 'Cuenta', 'Texto superior auth', 'text'),
    ).toEqual({
      key: 'auth_panel_eyebrow',
      value: 'Cuenta',
      group: 'branding',
      label: 'Texto superior auth',
      type: 'text',
    });
  });
});
