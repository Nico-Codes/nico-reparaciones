import type { AdminSettingItem } from './settingsApi';

export type HeroAsset = {
  title: string;
  slot: 'store_hero_desktop' | 'store_hero_mobile';
  settingKey: 'store_hero_image_desktop' | 'store_hero_image_mobile';
  recommended: string;
  optional: string;
  maxKb: number;
  mobile?: boolean;
};

export type HeroAssetSlot = HeroAsset['slot'];

export type HeroSettingsFormState = {
  title: string;
  text: string;
  gradientIntensity: string;
  gradientExtent: string;
  gradientColor: string;
  highContrast: boolean;
};

export const HERO_ASSETS: HeroAsset[] = [
  {
    title: 'Imagen desktop/tablet',
    slot: 'store_hero_desktop',
    settingKey: 'store_hero_image_desktop',
    recommended: '1920 x 500 px',
    optional: '3840 x 1000',
    maxKb: 6144,
  },
  {
    title: 'Imagen movil',
    slot: 'store_hero_mobile',
    settingKey: 'store_hero_image_mobile',
    recommended: '1280 x 720 px',
    optional: '1920 x 1080',
    maxKb: 4096,
    mobile: true,
  },
];

export const DEFAULT_HERO_FORM_STATE: HeroSettingsFormState = {
  title: '',
  text: '',
  gradientIntensity: '42',
  gradientExtent: '96',
  gradientColor: '#1052BE',
  highContrast: true,
};

export function buildHeroFormState(items: AdminSettingItem[]): HeroSettingsFormState {
  const valueByKey = new Map(items.map((item) => [item.key, item.value]));
  const rgb = (valueByKey.get('store_hero_fade_rgb_desktop') ?? '16, 82, 190').trim();

  return {
    title: valueByKey.get('store_hero_title') ?? DEFAULT_HERO_FORM_STATE.title,
    text: valueByKey.get('store_hero_subtitle') ?? DEFAULT_HERO_FORM_STATE.text,
    gradientIntensity: valueByKey.get('store_hero_fade_intensity') ?? DEFAULT_HERO_FORM_STATE.gradientIntensity,
    gradientExtent: valueByKey.get('store_hero_fade_size') ?? DEFAULT_HERO_FORM_STATE.gradientExtent,
    gradientColor: rgbToHex(rgb) ?? DEFAULT_HERO_FORM_STATE.gradientColor,
    highContrast: (valueByKey.get('store_hero_fade_mid_alpha') ?? '0.58') !== '0',
  };
}

export function buildHeroSettingsPayload(
  settingsByKey: Map<string, AdminSettingItem>,
  form: HeroSettingsFormState,
): Array<Pick<AdminSettingItem, 'key' | 'value' | 'group' | 'label' | 'type'>> {
  const rgb = hexToRgbString(form.gradientColor) ?? '16, 82, 190';

  return [
    patchHeroSetting(settingsByKey.get('store_hero_title'), 'store_hero_title', form.title, 'branding', 'Titulo portada tienda', 'text'),
    patchHeroSetting(
      settingsByKey.get('store_hero_subtitle'),
      'store_hero_subtitle',
      form.text,
      'branding',
      'Subtitulo portada tienda',
      'textarea',
    ),
    patchHeroSetting(
      settingsByKey.get('store_hero_fade_intensity'),
      'store_hero_fade_intensity',
      form.gradientIntensity,
      'branding',
      'Fade intensidad',
      'number',
    ),
    patchHeroSetting(
      settingsByKey.get('store_hero_fade_size'),
      'store_hero_fade_size',
      form.gradientExtent,
      'branding',
      'Fade tamano px',
      'number',
    ),
    patchHeroSetting(
      settingsByKey.get('store_hero_fade_rgb_desktop'),
      'store_hero_fade_rgb_desktop',
      rgb,
      'branding',
      'Fade portada desktop (RGB)',
      'text',
    ),
    patchHeroSetting(
      settingsByKey.get('store_hero_fade_rgb_mobile'),
      'store_hero_fade_rgb_mobile',
      rgb,
      'branding',
      'Fade portada mobile (RGB)',
      'text',
    ),
    patchHeroSetting(
      settingsByKey.get('store_hero_fade_mid_alpha'),
      'store_hero_fade_mid_alpha',
      form.highContrast ? '0.58' : '0',
      'branding',
      'Fade alpha medio',
      'text',
    ),
  ];
}

export function patchHeroSetting(
  existing: AdminSettingItem | undefined,
  key: string,
  value: string,
  group: string,
  label: string,
  type: string,
) {
  return {
    key,
    value,
    group: existing?.group ?? group,
    label: existing?.label ?? label,
    type: existing?.type ?? type,
  };
}

export function rgbToHex(rgb: string) {
  const parts = rgb.split(',').map((part) => Number.parseInt(part.trim(), 10));
  if (parts.length !== 3 || parts.some((value) => Number.isNaN(value) || value < 0 || value > 255)) return null;
  return `#${parts.map((value) => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export function hexToRgbString(hex: string) {
  const clean = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}
