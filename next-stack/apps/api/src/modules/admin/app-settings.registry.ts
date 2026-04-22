import type { AppSetting } from '@prisma/client';

export type AppSettingOwner = 'business' | 'branding' | 'email' | 'operations';
export type AppSettingValueType = 'text' | 'email' | 'number' | 'textarea' | 'json';

export type AppSettingDefinition = {
  key: string;
  group: string;
  label: string;
  type: AppSettingValueType;
  defaultValue: string;
  owner: AppSettingOwner;
};

export const APP_SETTING_DEFINITIONS = [
  { key: 'business_name', group: 'business', label: 'Nombre del negocio', type: 'text', defaultValue: 'NicoReparaciones', owner: 'business' },
  { key: 'shop_phone', group: 'business', label: 'Telefono WhatsApp', type: 'text', defaultValue: '', owner: 'business' },
  { key: 'shop_email', group: 'business', label: 'Email del local', type: 'email', defaultValue: '', owner: 'business' },
  { key: 'store_hero_title', group: 'branding', label: 'Titulo portada tienda', type: 'text', defaultValue: '', owner: 'branding' },
  { key: 'store_hero_subtitle', group: 'branding', label: 'SubTitulo portada tienda', type: 'textarea', defaultValue: '', owner: 'branding' },
  { key: 'store_hero_image_desktop', group: 'branding', label: 'Imagen portada tienda (desktop)', type: 'text', defaultValue: '', owner: 'branding' },
  { key: 'store_hero_image_mobile', group: 'branding', label: 'Imagen portada tienda (mobile)', type: 'text', defaultValue: '', owner: 'branding' },
  { key: 'brand_asset.auth_login_background.path', group: 'branding', label: 'Imagen fondo login (desktop)', type: 'text', defaultValue: 'brand/logo-bg.png', owner: 'branding' },
  { key: 'brand_asset.auth_login_background_mobile.path', group: 'branding', label: 'Imagen fondo login (mobile)', type: 'text', defaultValue: 'brand/logo-bg.png', owner: 'branding' },
  { key: 'auth_panel_eyebrow', group: 'branding', label: 'Texto superior auth', type: 'text', defaultValue: 'Cuenta web', owner: 'branding' },
  { key: 'auth_panel_title', group: 'branding', label: 'Titulo panel visual auth', type: 'text', defaultValue: 'Acceso claro y ordenado.', owner: 'branding' },
  { key: 'auth_panel_description', group: 'branding', label: 'Descripcion panel visual auth', type: 'textarea', defaultValue: 'Tu cuenta Nico para entrar, seguir pedidos y consultar reparaciones sin friccion.', owner: 'branding' },
  { key: 'auth_panel_eyebrow_color', group: 'branding', label: 'Color texto superior auth', type: 'text', defaultValue: '#FFFFFF', owner: 'branding' },
  { key: 'auth_panel_title_color', group: 'branding', label: 'Color titulo panel visual auth', type: 'text', defaultValue: '#FFFFFF', owner: 'branding' },
  { key: 'auth_panel_description_color', group: 'branding', label: 'Color descripcion panel visual auth', type: 'text', defaultValue: '#FFFFFF', owner: 'branding' },
  { key: 'brand_asset.checkout_payment_local.path', group: 'branding', label: 'Icono checkout pago en local', type: 'text', defaultValue: 'icons/payment-local.svg', owner: 'branding' },
  { key: 'brand_asset.checkout_payment_transfer.path', group: 'branding', label: 'Icono checkout transferencia', type: 'text', defaultValue: 'icons/payment-transfer.svg', owner: 'branding' },
  { key: 'brand_asset.icon_ayuda.path', group: 'branding', label: 'Icono ayuda', type: 'text', defaultValue: 'icons/ayuda.svg', owner: 'branding' },
  { key: 'brand_asset.icon_mi_cuenta.path', group: 'branding', label: 'Icono mi cuenta', type: 'text', defaultValue: 'icons/mi-cuenta.svg', owner: 'branding' },
  { key: 'brand_asset.icon_verificar_correo.path', group: 'branding', label: 'Icono verificar correo', type: 'text', defaultValue: 'icons/verificar-correo.svg', owner: 'branding' },
  { key: 'brand_asset.icon_admin_pedidos.path', group: 'branding', label: 'Icono admin pedidos', type: 'text', defaultValue: 'icons/admin-pedidos.svg', owner: 'branding' },
  { key: 'brand_asset.icon_admin_reparaciones.path', group: 'branding', label: 'Icono admin reparaciones', type: 'text', defaultValue: 'icons/admin-reparaciones.svg', owner: 'branding' },
  { key: 'brand_asset.icon_admin_venta_rapida.path', group: 'branding', label: 'Icono admin venta rapida', type: 'text', defaultValue: 'icons/admin-venta-rapida.svg', owner: 'branding' },
  { key: 'brand_asset.icon_admin_productos.path', group: 'branding', label: 'Icono admin productos', type: 'text', defaultValue: 'icons/admin-productos.svg', owner: 'branding' },
  { key: 'store_hero_fade_rgb_desktop', group: 'branding', label: 'Fade portada desktop (RGB)', type: 'text', defaultValue: '14, 165, 233', owner: 'branding' },
  { key: 'store_hero_fade_rgb_mobile', group: 'branding', label: 'Fade portada mobile (RGB)', type: 'text', defaultValue: '14, 165, 233', owner: 'branding' },
  { key: 'store_hero_fade_intensity', group: 'branding', label: 'Fade intensidad', type: 'number', defaultValue: '42', owner: 'branding' },
  { key: 'store_hero_fade_size', group: 'branding', label: 'Fade tamano px', type: 'number', defaultValue: '96', owner: 'branding' },
  { key: 'store_hero_fade_hold', group: 'branding', label: 'Fade hold %', type: 'number', defaultValue: '12', owner: 'branding' },
  { key: 'store_hero_fade_mid_alpha', group: 'branding', label: 'Fade alpha medio', type: 'text', defaultValue: '0.58', owner: 'branding' },
  { key: 'mail_from_name', group: 'email', label: 'Nombre remitente email', type: 'text', defaultValue: 'NicoReparaciones', owner: 'email' },
  { key: 'mail_from_address', group: 'email', label: 'Email remitente', type: 'email', defaultValue: '', owner: 'email' },
  { key: 'checkout_transfer_title', group: 'checkout', label: 'Titulo bloque transferencia checkout', type: 'text', defaultValue: 'Datos para transferencia', owner: 'operations' },
  { key: 'checkout_transfer_description', group: 'checkout', label: 'Descripcion bloque transferencia checkout', type: 'textarea', defaultValue: 'Si eliges transferencia, usa estos datos y conserva el comprobante para presentarlo al retirar.', owner: 'operations' },
  { key: 'checkout_transfer_holder_label', group: 'checkout', label: 'Label titular transferencia', type: 'text', defaultValue: 'Titular', owner: 'operations' },
  { key: 'checkout_transfer_holder_value', group: 'checkout', label: 'Valor titular transferencia', type: 'text', defaultValue: '', owner: 'operations' },
  { key: 'checkout_transfer_bank_label', group: 'checkout', label: 'Label banco transferencia', type: 'text', defaultValue: 'Banco', owner: 'operations' },
  { key: 'checkout_transfer_bank_value', group: 'checkout', label: 'Valor banco transferencia', type: 'text', defaultValue: '', owner: 'operations' },
  { key: 'checkout_transfer_alias_label', group: 'checkout', label: 'Label alias transferencia', type: 'text', defaultValue: 'Alias', owner: 'operations' },
  { key: 'checkout_transfer_alias_value', group: 'checkout', label: 'Valor alias transferencia', type: 'text', defaultValue: '', owner: 'operations' },
  { key: 'checkout_transfer_cvu_label', group: 'checkout', label: 'Label CVU/CBU transferencia', type: 'text', defaultValue: 'CVU / CBU', owner: 'operations' },
  { key: 'checkout_transfer_cvu_value', group: 'checkout', label: 'Valor CVU/CBU transferencia', type: 'text', defaultValue: '', owner: 'operations' },
  { key: 'checkout_transfer_tax_id_label', group: 'checkout', label: 'Label CUIT/CUIL transferencia', type: 'text', defaultValue: 'CUIT / CUIL', owner: 'operations' },
  { key: 'checkout_transfer_tax_id_value', group: 'checkout', label: 'Valor CUIT/CUIL transferencia', type: 'text', defaultValue: '', owner: 'operations' },
  { key: 'checkout_transfer_extra_label', group: 'checkout', label: 'Label dato extra transferencia', type: 'text', defaultValue: 'Referencia', owner: 'operations' },
  { key: 'checkout_transfer_extra_value', group: 'checkout', label: 'Valor dato extra transferencia', type: 'textarea', defaultValue: '', owner: 'operations' },
  { key: 'checkout_transfer_note', group: 'checkout', label: 'Nota bloque transferencia checkout', type: 'textarea', defaultValue: 'Si tienes dudas, contactanos antes de confirmar el pago.', owner: 'operations' },
  { key: 'ops_weekly_report_range_days', group: 'ops_reports', label: 'Dias de reporte semanal', type: 'number', defaultValue: '30', owner: 'operations' },
  { key: 'ops_weekly_report_emails', group: 'ops_reports', label: 'Emails reporte semanal', type: 'text', defaultValue: '', owner: 'operations' },
  { key: 'ops_alert_orders_stale_hours', group: 'ops_reports', label: 'Horas para alerta de pedidos', type: 'number', defaultValue: '24', owner: 'operations' },
  { key: 'ops_alert_repairs_stale_days', group: 'ops_reports', label: 'Dias para alerta de reparaciones', type: 'number', defaultValue: '7', owner: 'operations' },
  { key: 'ops_operational_alerts_dedupe_minutes', group: 'ops_reports', label: 'Minutos de dedupe para alertas operativas', type: 'number', defaultValue: '60', owner: 'operations' },
  { key: 'ops_operational_alerts_emails', group: 'ops_reports', label: 'Emails alertas operativas', type: 'text', defaultValue: '', owner: 'operations' },
  { key: 'ops_operational_alerts_last_status', group: 'ops_reports', label: 'Operational alerts last status', type: 'text', defaultValue: '', owner: 'operations' },
  { key: 'ops_operational_alerts_last_run_at', group: 'ops_reports', label: 'Operational alerts last run at', type: 'text', defaultValue: '', owner: 'operations' },
  { key: 'ops_operational_alerts_last_recipients', group: 'ops_reports', label: 'Operational alerts last recipients', type: 'text', defaultValue: '', owner: 'operations' },
  { key: 'ops_operational_alerts_last_summary', group: 'ops_reports', label: 'Operational alerts last summary', type: 'json', defaultValue: '{}', owner: 'operations' },
  { key: 'ops_operational_alerts_last_error', group: 'ops_reports', label: 'Operational alerts last error', type: 'text', defaultValue: '', owner: 'operations' },
] as const satisfies readonly AppSettingDefinition[];

export const APP_SETTING_DEFINITIONS_BY_KEY = new Map<string, AppSettingDefinition>(
  APP_SETTING_DEFINITIONS.map((item) => [item.key, item]),
);

export function getAppSettingDefinition(key: string) {
  return APP_SETTING_DEFINITIONS_BY_KEY.get(key) ?? null;
}

export type AppSettingListItem = {
  id: string | null;
  key: string;
  value: string;
  group: string;
  label: string;
  type: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export function mergeDefinedAndStoredAppSettings(existing: readonly AppSetting[]): AppSettingListItem[] {
  const byKey = new Map<string, AppSetting>(existing.map((item) => [item.key, item]));

  const merged = APP_SETTING_DEFINITIONS.map((definition) => {
    const found = byKey.get(definition.key);
    return found
      ? {
          id: found.id,
          key: found.key,
          value: found.value ?? definition.defaultValue,
          group: found.group,
          label: found.label ?? definition.label,
          type: found.type ?? definition.type,
          createdAt: found.createdAt.toISOString(),
          updatedAt: found.updatedAt.toISOString(),
        }
      : {
          id: null,
          key: definition.key,
          value: definition.defaultValue,
          group: definition.group,
          label: definition.label,
          type: definition.type,
          createdAt: null,
          updatedAt: null,
        };
  });

  const extras = existing
    .filter((item) => !APP_SETTING_DEFINITIONS_BY_KEY.has(item.key))
    .map((item) => ({
      id: item.id,
      key: item.key,
      value: item.value ?? '',
      group: item.group,
      label: item.label ?? item.key,
      type: item.type ?? 'text',
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

  return [...merged, ...extras];
}

export type BrandAssetSlotSpec = {
  settingKey: string;
  defaultPath: string;
  fileBase: string;
  maxKb: number;
  allowedExts: readonly string[];
};

export const BRAND_ASSET_SLOTS = {
  favicon_ico: { settingKey: 'brand_asset.favicon_ico.path', defaultPath: 'favicon.ico', fileBase: 'favicon-ico', maxKb: 1024, allowedExts: ['ico'] },
  favicon_16: { settingKey: 'brand_asset.favicon_16.path', defaultPath: 'favicon-16x16.png', fileBase: 'favicon-16x16', maxKb: 1024, allowedExts: ['png', 'ico', 'webp'] },
  favicon_32: { settingKey: 'brand_asset.favicon_32.path', defaultPath: 'favicon-32x32.png', fileBase: 'favicon-32x32', maxKb: 1024, allowedExts: ['png', 'ico', 'webp'] },
  android_192: { settingKey: 'brand_asset.android_192.path', defaultPath: 'android-chrome-192x192.png', fileBase: 'android-192', maxKb: 2048, allowedExts: ['png', 'jpg', 'jpeg', 'webp'] },
  android_512: { settingKey: 'brand_asset.android_512.path', defaultPath: 'android-chrome-512x512.png', fileBase: 'android-512', maxKb: 4096, allowedExts: ['png', 'jpg', 'jpeg', 'webp'] },
  apple_touch: { settingKey: 'brand_asset.apple_touch.path', defaultPath: 'apple-touch-icon.png', fileBase: 'apple-touch', maxKb: 2048, allowedExts: ['png', 'jpg', 'jpeg', 'webp'] },
  store_hero_desktop: { settingKey: 'store_hero_image_desktop', defaultPath: '', fileBase: 'store-hero-desktop', maxKb: 6144, allowedExts: ['png', 'jpg', 'jpeg', 'webp'] },
  store_hero_mobile: { settingKey: 'store_hero_image_mobile', defaultPath: '', fileBase: 'store-hero-mobile', maxKb: 4096, allowedExts: ['png', 'jpg', 'jpeg', 'webp'] },
  auth_login_background: { settingKey: 'brand_asset.auth_login_background.path', defaultPath: 'brand/logo-bg.png', fileBase: 'auth-login-background', maxKb: 6144, allowedExts: ['png', 'jpg', 'jpeg', 'webp'] },
  auth_login_background_mobile: { settingKey: 'brand_asset.auth_login_background_mobile.path', defaultPath: 'brand/logo-bg.png', fileBase: 'auth-login-background-mobile', maxKb: 4096, allowedExts: ['png', 'jpg', 'jpeg', 'webp'] },
  checkout_payment_local: { settingKey: 'brand_asset.checkout_payment_local.path', defaultPath: 'icons/payment-local.svg', fileBase: 'checkout-payment-local', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
  checkout_payment_transfer: { settingKey: 'brand_asset.checkout_payment_transfer.path', defaultPath: 'icons/payment-transfer.svg', fileBase: 'checkout-payment-transfer', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
  icon_settings: { settingKey: 'brand_asset.icon_settings.path', defaultPath: 'icons/settings.svg', fileBase: 'icon-settings', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
  icon_carrito: { settingKey: 'brand_asset.icon_carrito.path', defaultPath: 'icons/carrito.svg', fileBase: 'icon-carrito', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
  icon_logout: { settingKey: 'brand_asset.icon_logout.path', defaultPath: 'icons/logout.svg', fileBase: 'icon-logout', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
  icon_consultar_reparacion: { settingKey: 'brand_asset.icon_consultar_reparacion.path', defaultPath: 'icons/consultar-reparacion.svg', fileBase: 'icon-consultar-reparacion', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
  icon_mis_pedidos: { settingKey: 'brand_asset.icon_mis_pedidos.path', defaultPath: 'icons/mis-pedidos.svg', fileBase: 'icon-mis-pedidos', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
  icon_mis_reparaciones: { settingKey: 'brand_asset.icon_mis_reparaciones.path', defaultPath: 'icons/mis-reparaciones.svg', fileBase: 'icon-mis-reparaciones', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
  icon_dashboard: { settingKey: 'brand_asset.icon_dashboard.path', defaultPath: 'icons/dashboard.svg', fileBase: 'icon-dashboard', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
  icon_tienda: { settingKey: 'brand_asset.icon_tienda.path', defaultPath: 'icons/tienda.svg', fileBase: 'icon-tienda', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
  icon_ayuda: { settingKey: 'brand_asset.icon_ayuda.path', defaultPath: 'icons/ayuda.svg', fileBase: 'icon-ayuda', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
  icon_mi_cuenta: { settingKey: 'brand_asset.icon_mi_cuenta.path', defaultPath: 'icons/mi-cuenta.svg', fileBase: 'icon-mi-cuenta', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
  icon_verificar_correo: { settingKey: 'brand_asset.icon_verificar_correo.path', defaultPath: 'icons/verificar-correo.svg', fileBase: 'icon-verificar-correo', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
  icon_admin_pedidos: { settingKey: 'brand_asset.icon_admin_pedidos.path', defaultPath: 'icons/admin-pedidos.svg', fileBase: 'icon-admin-pedidos', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
  icon_admin_reparaciones: { settingKey: 'brand_asset.icon_admin_reparaciones.path', defaultPath: 'icons/admin-reparaciones.svg', fileBase: 'icon-admin-reparaciones', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
  icon_admin_venta_rapida: { settingKey: 'brand_asset.icon_admin_venta_rapida.path', defaultPath: 'icons/admin-venta-rapida.svg', fileBase: 'icon-admin-venta-rapida', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
  icon_admin_productos: { settingKey: 'brand_asset.icon_admin_productos.path', defaultPath: 'icons/admin-productos.svg', fileBase: 'icon-admin-productos', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
  logo_principal: { settingKey: 'brand_asset.logo_principal.path', defaultPath: 'brand/logo.png', fileBase: 'logo-principal', maxKb: 4096, allowedExts: ['png', 'jpg', 'jpeg', 'webp', 'svg'] },
} as const satisfies Record<string, BrandAssetSlotSpec>;
