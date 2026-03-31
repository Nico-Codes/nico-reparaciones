import { describe, expect, it } from 'vitest';
import {
  buildHeroFormState,
  buildHeroSettingsPayload,
  DEFAULT_HERO_FORM_STATE,
  hexToRgbString,
  patchHeroSetting,
  rgbToHex,
} from './admin-store-hero-settings.helpers';
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

describe('admin-store-hero-settings.helpers', () => {
  it('hydrates hero form state from settings with defaults', () => {
    const form = buildHeroFormState([
      makeSetting({ key: 'store_hero_title', value: 'Promo', group: 'branding', type: 'text' }),
      makeSetting({ key: 'store_hero_fade_rgb_desktop', value: '255, 0, 128', group: 'branding', type: 'text' }),
      makeSetting({ key: 'store_hero_fade_mid_alpha', value: '0', group: 'branding', type: 'text' }),
    ]);

    expect(form).toEqual({
      ...DEFAULT_HERO_FORM_STATE,
      title: 'Promo',
      gradientColor: '#FF0080',
      highContrast: false,
    });
  });

  it('patches hero settings preserving existing metadata', () => {
    expect(
      patchHeroSetting(
        makeSetting({ key: 'store_hero_title', value: 'Viejo', group: 'branding', type: 'textarea', label: 'Titulo actual' }),
        'store_hero_title',
        'Nuevo',
        'branding',
        'Titulo portada tienda',
        'text',
      ),
    ).toEqual({
      key: 'store_hero_title',
      value: 'Nuevo',
      group: 'branding',
      label: 'Titulo actual',
      type: 'textarea',
    });
  });

  it('converts rgb and hex color values', () => {
    expect(rgbToHex('16, 82, 190')).toBe('#1052BE');
    expect(rgbToHex('200,300,10')).toBeNull();
    expect(hexToRgbString('#1052BE')).toBe('16, 82, 190');
    expect(hexToRgbString('hola')).toBeNull();
  });

  it('builds hero settings payload using a shared rgb color', () => {
    const payload = buildHeroSettingsPayload(
      new Map([
        ['store_hero_title', makeSetting({ key: 'store_hero_title', value: '', group: 'branding', type: 'text', label: 'Titulo guardado' })],
      ]),
      {
        title: 'Nueva portada',
        text: 'Nuevo texto',
        gradientIntensity: '50',
        gradientExtent: '90',
        gradientColor: '#112233',
        highContrast: true,
      },
    );

    expect(payload.find((item) => item.key === 'store_hero_fade_rgb_desktop')?.value).toBe('17, 34, 51');
    expect(payload.find((item) => item.key === 'store_hero_fade_rgb_mobile')?.value).toBe('17, 34, 51');
    expect(payload.find((item) => item.key === 'store_hero_fade_mid_alpha')?.value).toBe('0.58');
    expect(payload.find((item) => item.key === 'store_hero_title')).toEqual({
      key: 'store_hero_title',
      value: 'Nueva portada',
      group: 'branding',
      label: 'Titulo guardado',
      type: 'text',
    });
  });
});
