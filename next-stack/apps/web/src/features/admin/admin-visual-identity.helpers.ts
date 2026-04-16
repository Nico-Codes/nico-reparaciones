import type { AdminSettingItem } from './settingsApi';

export type AssetCard = {
  title: string;
  filename: string;
  slot: string;
  settingKey: string;
  defaultPath: string;
  formats: string;
  maxKb: number;
  recommendedPx?: string;
  preview: PreviewSpec;
  showReset?: boolean;
};

export type PreviewSpec =
  | { kind: 'brand'; size?: 'sm' | 'md' | 'lg'; mono?: boolean }
  | { kind: 'hero'; mobile?: boolean }
  | { kind: 'icon'; icon: VisualIconName; tint?: string }
  | { kind: 'logo' };

export type VisualIconName =
  | 'settings'
  | 'cart'
  | 'logout'
  | 'repairLookup'
  | 'myOrders'
  | 'myRepairs'
  | 'dashboard'
  | 'store';

export type AssetSectionDefinition = {
  title: string;
  items: AssetCard[];
  columns: 'one' | 'two' | 'three';
};

export const FAVICON_ASSETS: AssetCard[] = [
  {
    title: 'Favicon .ico',
    filename: 'favicon.ico',
    slot: 'favicon_ico',
    settingKey: 'brand_asset.favicon_ico.path',
    defaultPath: 'favicon.ico',
    formats: 'ICO',
    maxKb: 1024,
    preview: { kind: 'brand', size: 'sm' },
    showReset: true,
  },
  {
    title: 'Favicon 16x16',
    filename: 'favicon-16x16.png',
    slot: 'favicon_16',
    settingKey: 'brand_asset.favicon_16.path',
    defaultPath: 'favicon-16x16.png',
    formats: 'PNG, ICO, WEBP',
    maxKb: 1024,
    preview: { kind: 'brand', size: 'sm' },
    showReset: true,
  },
  {
    title: 'Favicon 32x32',
    filename: 'favicon-32x32.png',
    slot: 'favicon_32',
    settingKey: 'brand_asset.favicon_32.path',
    defaultPath: 'favicon-32x32.png',
    formats: 'PNG, ICO, WEBP',
    maxKb: 1024,
    preview: { kind: 'brand', size: 'sm' },
    showReset: true,
  },
  {
    title: 'Icono Android 192',
    filename: 'android-chrome-192x192.png',
    slot: 'android_192',
    settingKey: 'brand_asset.android_192.path',
    defaultPath: 'android-chrome-192x192.png',
    formats: 'PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    preview: { kind: 'brand', size: 'md' },
    showReset: true,
  },
  {
    title: 'Icono Android 512',
    filename: 'android-chrome-512x512.png',
    slot: 'android_512',
    settingKey: 'brand_asset.android_512.path',
    defaultPath: 'android-chrome-512x512.png',
    formats: 'PNG, JPG, JPEG, WEBP',
    maxKb: 4096,
    preview: { kind: 'brand', size: 'md' },
    showReset: true,
  },
  {
    title: 'Icono Apple Touch',
    filename: 'apple-touch-icon.png',
    slot: 'apple_touch',
    settingKey: 'brand_asset.apple_touch.path',
    defaultPath: 'apple-touch-icon.png',
    formats: 'PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    preview: { kind: 'brand', size: 'md' },
    showReset: true,
  },
];

export const STORE_HERO_ASSETS: AssetCard[] = [
  {
    title: 'Fondo portada tienda (desktop)',
    filename: 'brand-assets/store_home_hero_desktop.png',
    slot: 'store_hero_desktop',
    settingKey: 'store_hero_image_desktop',
    defaultPath: '',
    formats: 'PNG, JPG, JPEG, WEBP',
    maxKb: 6144,
    recommendedPx: '1600 x 900 px o mayor',
    preview: { kind: 'hero' },
    showReset: true,
  },
  {
    title: 'Fondo portada tienda (movil)',
    filename: 'brand-assets/store_home_hero_mobile.png',
    slot: 'store_hero_mobile',
    settingKey: 'store_hero_image_mobile',
    defaultPath: '',
    formats: 'PNG, JPG, JPEG, WEBP',
    maxKb: 4096,
    recommendedPx: '1080 x 1440 px o mayor',
    preview: { kind: 'hero', mobile: true },
    showReset: true,
  },
];

export const AUTH_VISUAL_ASSETS: AssetCard[] = [
  {
    title: 'Fondo visual login (desktop)',
    filename: 'brand-assets/identity/auth-login-background.png',
    slot: 'auth_login_background',
    settingKey: 'brand_asset.auth_login_background.path',
    defaultPath: 'brand/logo-bg.png',
    formats: 'PNG, JPG, JPEG, WEBP',
    maxKb: 6144,
    recommendedPx: '1800 x 1400 px o mayor',
    preview: { kind: 'hero' },
    showReset: true,
  },
  {
    title: 'Fondo visual login (mobile)',
    filename: 'brand-assets/identity/auth-login-background-mobile.png',
    slot: 'auth_login_background_mobile',
    settingKey: 'brand_asset.auth_login_background_mobile.path',
    defaultPath: 'brand/logo-bg.png',
    formats: 'PNG, JPG, JPEG, WEBP',
    maxKb: 4096,
    recommendedPx: '1080 x 720 px o mayor',
    preview: { kind: 'hero', mobile: true },
    showReset: true,
  },
];

export const NAV_ICON_ASSETS: AssetCard[] = [
  {
    title: 'Icono ajustes',
    filename: 'icons/settings.svg',
    slot: 'icon_settings',
    settingKey: 'brand_asset.icon_settings.path',
    defaultPath: 'icons/settings.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    preview: { kind: 'icon', icon: 'settings', tint: 'text-slate-500' },
    showReset: true,
  },
  {
    title: 'Icono carrito',
    filename: 'icons/carrito.svg',
    slot: 'icon_carrito',
    settingKey: 'brand_asset.icon_carrito.path',
    defaultPath: 'icons/carrito.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    preview: { kind: 'icon', icon: 'cart', tint: 'text-amber-500' },
    showReset: true,
  },
  {
    title: 'Icono cerrar sesion',
    filename: 'icons/logout.svg',
    slot: 'icon_logout',
    settingKey: 'brand_asset.icon_logout.path',
    defaultPath: 'icons/logout.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    preview: { kind: 'icon', icon: 'logout', tint: 'text-rose-500' },
    showReset: true,
  },
  {
    title: 'Icono consultar reparacion',
    filename: 'icons/consultar-reparacion.svg',
    slot: 'icon_consultar_reparacion',
    settingKey: 'brand_asset.icon_consultar_reparacion.path',
    defaultPath: 'icons/consultar-reparacion.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    preview: { kind: 'icon', icon: 'repairLookup', tint: 'text-sky-600' },
    showReset: true,
  },
  {
    title: 'Icono mis pedidos',
    filename: 'icons/mis-pedidos.svg',
    slot: 'icon_mis_pedidos',
    settingKey: 'brand_asset.icon_mis_pedidos.path',
    defaultPath: 'icons/mis-pedidos.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    preview: { kind: 'icon', icon: 'myOrders', tint: 'text-blue-500' },
    showReset: true,
  },
  {
    title: 'Icono mis reparaciones',
    filename: 'icons/mis-reparaciones.svg',
    slot: 'icon_mis_reparaciones',
    settingKey: 'brand_asset.icon_mis_reparaciones.path',
    defaultPath: 'icons/mis-reparaciones.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    preview: { kind: 'icon', icon: 'myRepairs', tint: 'text-zinc-700' },
    showReset: true,
  },
  {
    title: 'Icono panel de admin',
    filename: 'icons/dashboard.svg',
    slot: 'icon_dashboard',
    settingKey: 'brand_asset.icon_dashboard.path',
    defaultPath: 'icons/dashboard.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    preview: { kind: 'icon', icon: 'dashboard', tint: 'text-slate-500' },
    showReset: true,
  },
  {
    title: 'Icono tienda',
    filename: 'icons/tienda.svg',
    slot: 'icon_tienda',
    settingKey: 'brand_asset.icon_tienda.path',
    defaultPath: 'icons/tienda.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    preview: { kind: 'icon', icon: 'store', tint: 'text-sky-600' },
    showReset: true,
  },
];

export const LOGO_ASSETS: AssetCard[] = [
  {
    title: 'Logo principal',
    filename: 'brand/logo.png',
    slot: 'logo_principal',
    settingKey: 'brand_asset.logo_principal.path',
    defaultPath: 'brand/logo.png',
    formats: 'PNG, JPG, JPEG, WEBP, SVG',
    maxKb: 4096,
    preview: { kind: 'logo' },
    showReset: true,
  },
];

export const VISUAL_IDENTITY_SECTIONS: AssetSectionDefinition[] = [
  { title: 'Favicons e iconos de app', items: FAVICON_ASSETS, columns: 'three' },
  { title: 'Portada de tienda', items: STORE_HERO_ASSETS, columns: 'two' },
  { title: 'Acceso y auth', items: AUTH_VISUAL_ASSETS, columns: 'one' },
  { title: 'Iconos de navegacion', items: NAV_ICON_ASSETS, columns: 'three' },
  { title: 'Logos', items: LOGO_ASSETS, columns: 'one' },
];

export function resolveAssetState(item: AssetCard, settingsByKey: Map<string, AdminSettingItem>) {
  const settingValue = settingsByKey.get(item.settingKey)?.value ?? '';
  const isCustom = settingValue.trim().length > 0;
  const effectivePath = isCustom ? settingValue : item.defaultPath;

  return {
    isCustom,
    effectivePath,
    displayPath: isCustom
      ? summarizeAssetPath(effectivePath)
      : item.defaultPath.trim()
        ? item.filename
        : 'Sin archivo configurado',
  };
}

export function summarizeAssetPath(path: string) {
  const trimmed = path.trim();
  if (!trimmed) return '';
  const parts = trimmed.split('/').filter(Boolean);
  return parts.slice(-2).join('/') || trimmed;
}

export function acceptFromFormats(formats: string) {
  const map: Record<string, string> = {
    PNG: '.png',
    JPG: '.jpg',
    JPEG: '.jpeg',
    WEBP: '.webp',
    ICO: '.ico',
    SVG: '.svg',
  };

  return formats
    .split(',')
    .map((format) => map[format.trim().toUpperCase()])
    .filter(Boolean)
    .join(',');
}
