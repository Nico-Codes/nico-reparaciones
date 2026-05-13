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
  | 'store'
  | 'help'
  | 'account'
  | 'mail'
  | 'barChart'
  | 'palette'
  | 'landmark'
  | 'verifyEmail'
  | 'adminOrders'
  | 'adminRepairs'
  | 'quickSale'
  | 'products'
  | 'paymentLocal'
  | 'paymentTransfer'
  | 'menu'
  | 'close'
  | 'search'
  | 'filter'
  | 'tags'
  | 'chevronDown'
  | 'arrowLeft'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'alert'
  | 'success'
  | 'upload'
  | 'download'
  | 'empty'
  | 'whatsapp'
  | 'externalLink'
  | 'clock'
  | 'calculator'
  | 'package'
  | 'receipt'
  | 'truck'
  | 'refresh'
  | 'shield'
  | 'users'
  | 'building'
  | 'percent'
  | 'sparkles'
  | 'image'
  | 'fileText'
  | 'folderTree'
  | 'layers'
  | 'tag'
  | 'banknote'
  | 'message'
  | 'clipboard'
  | 'issueScreen'
  | 'issueBattery'
  | 'issueCharge'
  | 'issueBoard'
  | 'issueCamera'
  | 'issueAudio'
  | 'issueSoftware'
  | 'issueWater'
  | 'issueGeneric';

export type AssetSectionDefinition = {
  title: string;
  items: AssetCard[];
  columns: 'one' | 'two' | 'three';
};

export type AuthVisualFormState = {
  eyebrow: string;
  title: string;
  description: string;
  eyebrowColor: string;
  titleColor: string;
  descriptionColor: string;
};

const ICON_RECOMMENDED_SIZE = '1:1 - SVG con viewBox 24 x 24 o PNG/WEBP 128 x 128 px o mayor';

function editableIconAsset(title: string, slot: string, icon: VisualIconName, tint = 'text-zinc-700'): AssetCard {
  return {
    title,
    filename: `brand-assets/identity/${slot}`,
    slot,
    settingKey: `brand_asset.${slot}.path`,
    defaultPath: '',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon, tint },
    showReset: true,
  };
}

export const DEFAULT_AUTH_VISUAL_FORM_STATE: AuthVisualFormState = {
  eyebrow: 'Cuenta web',
  title: 'Acceso claro y ordenado.',
  description: 'Tu cuenta Nico para entrar, seguir pedidos y consultar reparaciones sin friccion.',
  eyebrowColor: '#FFFFFF',
  titleColor: '#FFFFFF',
  descriptionColor: '#FFFFFF',
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
    recommendedPx: '1:1 - incluir 16 x 16, 32 x 32 y 48 x 48 px',
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
    recommendedPx: '1:1 - 16 x 16 px exacto',
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
    recommendedPx: '1:1 - 32 x 32 px exacto',
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
    recommendedPx: '1:1 - 192 x 192 px exacto',
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
    recommendedPx: '1:1 - 512 x 512 px exacto',
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
    recommendedPx: '1:1 - 180 x 180 px o mayor',
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
    recommendedPx: '16:9 - 1600 x 900 px o mayor',
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
    recommendedPx: '3:4 - 1080 x 1440 px o mayor',
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
    recommendedPx: '9:7 - 1800 x 1400 px o mayor',
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
    recommendedPx: '3:2 - 1080 x 720 px o mayor',
    preview: { kind: 'hero', mobile: true },
    showReset: true,
  },
];

export const NAV_ICON_ASSETS: AssetCard[] = [
  {
    title: 'Icono ajustes',
    filename: 'icons/v4/settings.svg',
    slot: 'icon_settings',
    settingKey: 'brand_asset.icon_settings.path',
    defaultPath: 'icons/v4/settings.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'settings', tint: 'text-slate-500' },
    showReset: true,
  },
  {
    title: 'Icono carrito',
    filename: 'icons/v4/carrito.svg',
    slot: 'icon_carrito',
    settingKey: 'brand_asset.icon_carrito.path',
    defaultPath: 'icons/v4/carrito.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'cart', tint: 'text-zinc-900' },
    showReset: true,
  },
  {
    title: 'Icono cerrar sesion',
    filename: 'icons/v4/logout.svg',
    slot: 'icon_logout',
    settingKey: 'brand_asset.icon_logout.path',
    defaultPath: 'icons/v4/logout.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'logout', tint: 'text-rose-500' },
    showReset: true,
  },
  {
    title: 'Icono consultar reparacion',
    filename: 'icons/v5/consultar-reparacion.svg',
    slot: 'icon_consultar_reparacion',
    settingKey: 'brand_asset.icon_consultar_reparacion.path',
    defaultPath: 'icons/v5/consultar-reparacion.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'repairLookup', tint: 'text-sky-600' },
    showReset: true,
  },
  {
    title: 'Icono mis pedidos',
    filename: 'icons/v4/mis-pedidos.svg',
    slot: 'icon_mis_pedidos',
    settingKey: 'brand_asset.icon_mis_pedidos.path',
    defaultPath: 'icons/v4/mis-pedidos.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'myOrders', tint: 'text-blue-500' },
    showReset: true,
  },
  {
    title: 'Icono mis reparaciones',
    filename: 'icons/v5/mis-reparaciones.svg',
    slot: 'icon_mis_reparaciones',
    settingKey: 'brand_asset.icon_mis_reparaciones.path',
    defaultPath: 'icons/v5/mis-reparaciones.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'myRepairs', tint: 'text-zinc-700' },
    showReset: true,
  },
  {
    title: 'Icono panel de admin',
    filename: 'icons/v4/dashboard.svg',
    slot: 'icon_dashboard',
    settingKey: 'brand_asset.icon_dashboard.path',
    defaultPath: 'icons/v4/dashboard.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'dashboard', tint: 'text-slate-500' },
    showReset: true,
  },
  {
    title: 'Icono tienda',
    filename: 'icons/v4/tienda.svg',
    slot: 'icon_tienda',
    settingKey: 'brand_asset.icon_tienda.path',
    defaultPath: 'icons/v4/tienda.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'store', tint: 'text-sky-600' },
    showReset: true,
  },
  {
    title: 'Icono ayuda',
    filename: 'icons/v4/ayuda.svg',
    slot: 'icon_ayuda',
    settingKey: 'brand_asset.icon_ayuda.path',
    defaultPath: 'icons/v4/ayuda.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'help', tint: 'text-zinc-700' },
    showReset: true,
  },
  {
    title: 'Icono mi cuenta',
    filename: 'icons/v4/mi-cuenta.svg',
    slot: 'icon_mi_cuenta',
    settingKey: 'brand_asset.icon_mi_cuenta.path',
    defaultPath: 'icons/v4/mi-cuenta.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'account', tint: 'text-zinc-700' },
    showReset: true,
  },
  {
    title: 'Icono verificar correo',
    filename: 'icons/v5/verificar-correo.svg',
    slot: 'icon_verificar_correo',
    settingKey: 'brand_asset.icon_verificar_correo.path',
    defaultPath: 'icons/v5/verificar-correo.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'verifyEmail', tint: 'text-amber-700' },
    showReset: true,
  },
  {
    title: 'Icono admin pedidos',
    filename: 'icons/v4/admin-pedidos.svg',
    slot: 'icon_admin_pedidos',
    settingKey: 'brand_asset.icon_admin_pedidos.path',
    defaultPath: 'icons/v4/admin-pedidos.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'adminOrders', tint: 'text-slate-600' },
    showReset: true,
  },
  {
    title: 'Icono admin reparaciones',
    filename: 'icons/v5/admin-reparaciones.svg',
    slot: 'icon_admin_reparaciones',
    settingKey: 'brand_asset.icon_admin_reparaciones.path',
    defaultPath: 'icons/v5/admin-reparaciones.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'adminRepairs', tint: 'text-slate-600' },
    showReset: true,
  },
  {
    title: 'Icono venta rapida',
    filename: 'icons/v4/admin-venta-rapida.svg',
    slot: 'icon_admin_venta_rapida',
    settingKey: 'brand_asset.icon_admin_venta_rapida.path',
    defaultPath: 'icons/v4/admin-venta-rapida.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'quickSale', tint: 'text-slate-600' },
    showReset: true,
  },
  {
    title: 'Icono admin productos',
    filename: 'icons/v4/admin-productos.svg',
    slot: 'icon_admin_productos',
    settingKey: 'brand_asset.icon_admin_productos.path',
    defaultPath: 'icons/v4/admin-productos.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'products', tint: 'text-slate-600' },
    showReset: true,
  },
];

export const CHECKOUT_ICON_ASSETS: AssetCard[] = [
  {
    title: 'Icono pago en local',
    filename: 'icons/v4/payment-local.svg',
    slot: 'checkout_payment_local',
    settingKey: 'brand_asset.checkout_payment_local.path',
    defaultPath: 'icons/v4/payment-local.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'paymentLocal', tint: 'text-emerald-600' },
    showReset: true,
  },
  {
    title: 'Icono transferencia',
    filename: 'icons/v4/payment-transfer.svg',
    slot: 'checkout_payment_transfer',
    settingKey: 'brand_asset.checkout_payment_transfer.path',
    defaultPath: 'icons/v4/payment-transfer.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'paymentTransfer', tint: 'text-sky-600' },
    showReset: true,
  },
];

export const GLOBAL_ACTION_ICON_ASSETS: AssetCard[] = [
  editableIconAsset('Icono menu', 'icon_menu', 'menu', 'text-zinc-900'),
  editableIconAsset('Icono cerrar', 'icon_close', 'close', 'text-zinc-800'),
  editableIconAsset('Icono buscar', 'icon_search', 'search', 'text-sky-700'),
  editableIconAsset('Icono filtros/orden', 'icon_filter', 'filter', 'text-sky-700'),
  editableIconAsset('Icono etiquetas/categorias', 'icon_tags', 'tags', 'text-sky-700'),
  editableIconAsset('Icono desplegar', 'icon_chevron_down', 'chevronDown', 'text-zinc-600'),
  editableIconAsset('Icono volver', 'icon_arrow_left', 'arrowLeft', 'text-zinc-700'),
  editableIconAsset('Icono sumar', 'icon_plus', 'plus', 'text-blue-600'),
  editableIconAsset('Icono restar', 'icon_minus', 'minus', 'text-blue-600'),
  editableIconAsset('Icono eliminar', 'icon_trash', 'trash', 'text-slate-600'),
  editableIconAsset('Icono alerta', 'icon_alert', 'alert', 'text-amber-700'),
  editableIconAsset('Icono exito', 'icon_success', 'success', 'text-emerald-700'),
  editableIconAsset('Icono subir archivo', 'icon_upload', 'upload', 'text-blue-600'),
  editableIconAsset('Icono descargar', 'icon_download', 'download', 'text-slate-600'),
  editableIconAsset('Icono estado vacio', 'icon_empty', 'empty', 'text-blue-600'),
  editableIconAsset('Icono enlace externo', 'icon_external_link', 'externalLink', 'text-slate-700'),
];

export const STORE_ACTION_ICON_ASSETS: AssetCard[] = [
  editableIconAsset('Icono producto', 'icon_package', 'package', 'text-sky-700'),
  editableIconAsset('Icono categoria', 'icon_tag', 'tag', 'text-sky-700'),
  editableIconAsset('Icono imagen', 'icon_image', 'image', 'text-slate-600'),
  editableIconAsset('Icono capas', 'icon_layers', 'layers', 'text-slate-600'),
];

export const ORDER_ICON_ASSETS: AssetCard[] = [
  editableIconAsset('Icono WhatsApp', 'icon_whatsapp', 'whatsapp', 'text-emerald-700'),
  editableIconAsset('Icono mensaje', 'icon_message', 'message', 'text-sky-700'),
  editableIconAsset('Icono comprobante', 'icon_receipt', 'receipt', 'text-slate-700'),
  editableIconAsset('Icono envio/retiro', 'icon_truck', 'truck', 'text-slate-700'),
  editableIconAsset('Icono portapapeles', 'icon_clipboard', 'clipboard', 'text-slate-700'),
];

export const REPAIR_ICON_ASSETS: AssetCard[] = [
  editableIconAsset('Icono reloj/tiempo', 'icon_clock', 'clock', 'text-slate-700'),
  editableIconAsset('Icono calculadora', 'icon_calculator', 'calculator', 'text-sky-700'),
  editableIconAsset('Icono proteccion/estado', 'icon_shield', 'shield', 'text-emerald-700'),
  editableIconAsset('Icono refrescar', 'icon_refresh', 'refresh', 'text-blue-600'),
  {
    title: 'Falla modulo / pantalla',
    filename: 'icons/repair-issues/screen.svg',
    slot: 'repair_issue_screen',
    settingKey: 'brand_asset.repair_issue_screen.path',
    defaultPath: 'icons/repair-issues/screen.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'issueScreen', tint: 'text-slate-800' },
    showReset: true,
  },
  {
    title: 'Falla bateria',
    filename: 'icons/repair-issues/battery.svg',
    slot: 'repair_issue_battery',
    settingKey: 'brand_asset.repair_issue_battery.path',
    defaultPath: 'icons/repair-issues/battery.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'issueBattery', tint: 'text-slate-800' },
    showReset: true,
  },
  {
    title: 'Falla placa de carga',
    filename: 'icons/repair-issues/charge.svg',
    slot: 'repair_issue_charge',
    settingKey: 'brand_asset.repair_issue_charge.path',
    defaultPath: 'icons/repair-issues/charge.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'issueCharge', tint: 'text-slate-800' },
    showReset: true,
  },
  {
    title: 'Falla placa / mother',
    filename: 'icons/repair-issues/board.svg',
    slot: 'repair_issue_board',
    settingKey: 'brand_asset.repair_issue_board.path',
    defaultPath: 'icons/repair-issues/board.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'issueBoard', tint: 'text-slate-800' },
    showReset: true,
  },
  {
    title: 'Falla camara',
    filename: 'icons/repair-issues/camera.svg',
    slot: 'repair_issue_camera',
    settingKey: 'brand_asset.repair_issue_camera.path',
    defaultPath: 'icons/repair-issues/camera.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'issueCamera', tint: 'text-slate-800' },
    showReset: true,
  },
  {
    title: 'Falla audio / parlante',
    filename: 'icons/repair-issues/audio.svg',
    slot: 'repair_issue_audio',
    settingKey: 'brand_asset.repair_issue_audio.path',
    defaultPath: 'icons/repair-issues/audio.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'issueAudio', tint: 'text-slate-800' },
    showReset: true,
  },
  {
    title: 'Falla software',
    filename: 'icons/repair-issues/software.svg',
    slot: 'repair_issue_software',
    settingKey: 'brand_asset.repair_issue_software.path',
    defaultPath: 'icons/repair-issues/software.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'issueSoftware', tint: 'text-slate-800' },
    showReset: true,
  },
  {
    title: 'Falla humedad / agua',
    filename: 'icons/repair-issues/water.svg',
    slot: 'repair_issue_water',
    settingKey: 'brand_asset.repair_issue_water.path',
    defaultPath: 'icons/repair-issues/water.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'issueWater', tint: 'text-slate-800' },
    showReset: true,
  },
  {
    title: 'Falla generica',
    filename: 'icons/repair-issues/generic.svg',
    slot: 'repair_issue_generic',
    settingKey: 'brand_asset.repair_issue_generic.path',
    defaultPath: 'icons/repair-issues/generic.svg',
    formats: 'SVG, PNG, JPG, JPEG, WEBP',
    maxKb: 2048,
    recommendedPx: ICON_RECOMMENDED_SIZE,
    preview: { kind: 'icon', icon: 'issueGeneric', tint: 'text-slate-800' },
    showReset: true,
  },
];

export const ADMIN_ACTION_ICON_ASSETS: AssetCard[] = [
  editableIconAsset('Icono usuarios', 'icon_users', 'users', 'text-slate-700'),
  editableIconAsset('Icono negocio', 'icon_building', 'building', 'text-slate-700'),
  editableIconAsset('Icono porcentaje', 'icon_percent', 'percent', 'text-slate-700'),
  editableIconAsset('Icono destacado', 'icon_sparkles', 'sparkles', 'text-amber-700'),
  editableIconAsset('Icono archivo', 'icon_file_text', 'fileText', 'text-slate-700'),
  editableIconAsset('Icono arbol categorias', 'icon_folder_tree', 'folderTree', 'text-slate-700'),
  editableIconAsset('Icono dinero', 'icon_banknote', 'banknote', 'text-emerald-700'),
];

export const ADMIN_SETTINGS_HUB_ICON_ASSETS: AssetCard[] = [
  editableIconAsset('Icono config correo SMTP', 'icon_settings_hub_mail', 'mail', 'text-sky-700'),
  editableIconAsset('Icono config reportes', 'icon_settings_hub_reports', 'barChart', 'text-sky-700'),
  editableIconAsset('Icono config negocio', 'icon_settings_hub_business', 'building', 'text-slate-700'),
  editableIconAsset('Icono config checkout', 'icon_settings_hub_checkout', 'landmark', 'text-slate-700'),
  editableIconAsset('Icono config calculos', 'icon_settings_hub_calculations', 'calculator', 'text-sky-700'),
  editableIconAsset('Icono config plantillas email', 'icon_settings_hub_mail_templates', 'fileText', 'text-slate-700'),
  editableIconAsset('Icono config ayuda', 'icon_settings_hub_help', 'help', 'text-sky-700'),
  editableIconAsset('Icono config identidad visual', 'icon_settings_hub_identity', 'palette', 'text-indigo-700'),
  editableIconAsset('Icono config portada tienda', 'icon_settings_hub_store_hero', 'image', 'text-slate-700'),
  editableIconAsset('Icono config seguridad 2FA', 'icon_settings_hub_security', 'shield', 'text-emerald-700'),
  editableIconAsset('Icono config WhatsApp reparaciones', 'icon_settings_hub_whatsapp_repairs', 'message', 'text-emerald-700'),
  editableIconAsset('Icono config WhatsApp pedidos', 'icon_settings_hub_whatsapp_orders', 'message', 'text-emerald-700'),
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
    recommendedPx: '1:1 - 512 x 512 px o mayor, preferible con fondo transparente',
    preview: { kind: 'logo' },
    showReset: true,
  },
];

export const VISUAL_IDENTITY_SECTIONS: AssetSectionDefinition[] = [
  { title: 'Favicons e iconos de app', items: FAVICON_ASSETS, columns: 'three' },
  { title: 'Logos', items: LOGO_ASSETS, columns: 'one' },
  { title: 'Portada de tienda', items: STORE_HERO_ASSETS, columns: 'two' },
  { title: 'Acceso y auth', items: AUTH_VISUAL_ASSETS, columns: 'one' },
  { title: 'Navegacion', items: NAV_ICON_ASSETS, columns: 'three' },
  { title: 'Checkout y pagos', items: CHECKOUT_ICON_ASSETS, columns: 'two' },
  { title: 'Acciones y estados', items: GLOBAL_ACTION_ICON_ASSETS, columns: 'three' },
  { title: 'Tienda y productos', items: STORE_ACTION_ICON_ASSETS, columns: 'three' },
  { title: 'Pedidos y WhatsApp', items: ORDER_ICON_ASSETS, columns: 'three' },
  { title: 'Reparaciones', items: REPAIR_ICON_ASSETS, columns: 'three' },
  { title: 'Admin: configuracion', items: ADMIN_SETTINGS_HUB_ICON_ASSETS, columns: 'three' },
  { title: 'Admin', items: ADMIN_ACTION_ICON_ASSETS, columns: 'three' },
];

export function resolveAssetState(item: AssetCard, settingsByKey: Map<string, AdminSettingItem>) {
  const setting = settingsByKey.get(item.settingKey);
  const settingValue = setting?.value ?? '';
  const trimmedValue = settingValue.trim();
  const isCustom = trimmedValue.length > 0 && trimmedValue !== item.defaultPath.trim();
  const effectivePath = isCustom ? settingValue : item.defaultPath;

  return {
    isCustom,
    effectivePath,
    updatedAt: isCustom ? setting?.updatedAt ?? null : null,
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

export function buildAssetDownloadName(item: AssetCard, effectivePath: string) {
  const rawPath = effectivePath.trim() || item.filename.trim() || item.defaultPath.trim();
  const cleanPath = rawPath.split(/[?#]/)[0] ?? '';
  const filename = cleanPath.split('/').filter(Boolean).at(-1);
  return filename || item.slot;
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

export function buildAuthVisualFormState(items: AdminSettingItem[]): AuthVisualFormState {
  const valueByKey = new Map(items.map((item) => [item.key, item.value]));
  const legacyTextColor = normalizeHexColor(valueByKey.get('auth_panel_text_color') ?? DEFAULT_AUTH_VISUAL_FORM_STATE.titleColor);

  return {
    eyebrow: (valueByKey.get('auth_panel_eyebrow') ?? DEFAULT_AUTH_VISUAL_FORM_STATE.eyebrow).trim() || DEFAULT_AUTH_VISUAL_FORM_STATE.eyebrow,
    title: (valueByKey.get('auth_panel_title') ?? DEFAULT_AUTH_VISUAL_FORM_STATE.title).trim() || DEFAULT_AUTH_VISUAL_FORM_STATE.title,
    description:
      (valueByKey.get('auth_panel_description') ?? DEFAULT_AUTH_VISUAL_FORM_STATE.description).trim() ||
      DEFAULT_AUTH_VISUAL_FORM_STATE.description,
    eyebrowColor: normalizeHexColor(valueByKey.get('auth_panel_eyebrow_color') ?? legacyTextColor),
    titleColor: normalizeHexColor(valueByKey.get('auth_panel_title_color') ?? legacyTextColor),
    descriptionColor: normalizeHexColor(valueByKey.get('auth_panel_description_color') ?? legacyTextColor),
  };
}

export function buildAuthVisualSettingsPayload(
  settingsByKey: Map<string, AdminSettingItem>,
  form: AuthVisualFormState,
): Array<Pick<AdminSettingItem, 'key' | 'value' | 'group' | 'label' | 'type'>> {
  return [
    patchAuthVisualSetting(settingsByKey.get('auth_panel_eyebrow'), 'auth_panel_eyebrow', form.eyebrow, 'Texto superior auth', 'text'),
    patchAuthVisualSetting(settingsByKey.get('auth_panel_title'), 'auth_panel_title', form.title, 'Titulo panel visual auth', 'text'),
    patchAuthVisualSetting(
      settingsByKey.get('auth_panel_description'),
      'auth_panel_description',
      form.description,
      'Descripcion panel visual auth',
      'textarea',
    ),
    patchAuthVisualSetting(
      settingsByKey.get('auth_panel_eyebrow_color'),
      'auth_panel_eyebrow_color',
      normalizeHexColor(form.eyebrowColor),
      'Color texto superior auth',
      'text',
    ),
    patchAuthVisualSetting(
      settingsByKey.get('auth_panel_title_color'),
      'auth_panel_title_color',
      normalizeHexColor(form.titleColor),
      'Color titulo panel visual auth',
      'text',
    ),
    patchAuthVisualSetting(
      settingsByKey.get('auth_panel_description_color'),
      'auth_panel_description_color',
      normalizeHexColor(form.descriptionColor),
      'Color descripcion panel visual auth',
      'text',
    ),
  ];
}

export function patchAuthVisualSetting(
  existing: AdminSettingItem | undefined,
  key: string,
  value: string,
  label: string,
  type: string,
) {
  return {
    key,
    value,
    group: existing?.group ?? 'branding',
    label: existing?.label ?? label,
    type: existing?.type ?? type,
  };
}

export function normalizeHexColor(value: string) {
  const trimmed = value.trim();
  const normalized = trimmed.startsWith('#') ? trimmed.toUpperCase() : `#${trimmed.toUpperCase()}`;
  return /^#([0-9A-F]{6})$/.test(normalized) ? normalized : DEFAULT_AUTH_VISUAL_FORM_STATE.titleColor;
}
