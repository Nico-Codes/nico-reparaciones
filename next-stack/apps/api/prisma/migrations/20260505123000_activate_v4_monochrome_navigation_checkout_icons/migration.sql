WITH target_icons(slot, setting_key, previous_default_path, new_path) AS (
  VALUES
    ('icon_settings', 'brand_asset.icon_settings.path', 'icons/v3/settings.svg', 'icons/v4/settings.svg'),
    ('icon_carrito', 'brand_asset.icon_carrito.path', 'icons/v3/carrito.svg', 'icons/v4/carrito.svg'),
    ('icon_logout', 'brand_asset.icon_logout.path', 'icons/v3/logout.svg', 'icons/v4/logout.svg'),
    ('icon_consultar_reparacion', 'brand_asset.icon_consultar_reparacion.path', 'icons/v3/consultar-reparacion.svg', 'icons/v4/consultar-reparacion.svg'),
    ('icon_mis_pedidos', 'brand_asset.icon_mis_pedidos.path', 'icons/v3/mis-pedidos.svg', 'icons/v4/mis-pedidos.svg'),
    ('icon_mis_reparaciones', 'brand_asset.icon_mis_reparaciones.path', 'icons/v3/mis-reparaciones.svg', 'icons/v4/mis-reparaciones.svg'),
    ('icon_dashboard', 'brand_asset.icon_dashboard.path', 'icons/v3/dashboard.svg', 'icons/v4/dashboard.svg'),
    ('icon_tienda', 'brand_asset.icon_tienda.path', 'icons/v3/tienda.svg', 'icons/v4/tienda.svg'),
    ('icon_ayuda', 'brand_asset.icon_ayuda.path', 'icons/v3/ayuda.svg', 'icons/v4/ayuda.svg'),
    ('icon_mi_cuenta', 'brand_asset.icon_mi_cuenta.path', 'icons/v3/mi-cuenta.svg', 'icons/v4/mi-cuenta.svg'),
    ('icon_verificar_correo', 'brand_asset.icon_verificar_correo.path', 'icons/v3/verificar-correo.svg', 'icons/v4/verificar-correo.svg'),
    ('icon_admin_pedidos', 'brand_asset.icon_admin_pedidos.path', 'icons/v3/admin-pedidos.svg', 'icons/v4/admin-pedidos.svg'),
    ('icon_admin_reparaciones', 'brand_asset.icon_admin_reparaciones.path', 'icons/v3/admin-reparaciones.svg', 'icons/v4/admin-reparaciones.svg'),
    ('icon_admin_venta_rapida', 'brand_asset.icon_admin_venta_rapida.path', 'icons/v3/admin-venta-rapida.svg', 'icons/v4/admin-venta-rapida.svg'),
    ('icon_admin_productos', 'brand_asset.icon_admin_productos.path', 'icons/v3/admin-productos.svg', 'icons/v4/admin-productos.svg'),
    ('checkout_payment_local', 'brand_asset.checkout_payment_local.path', 'icons/v3/payment-local.svg', 'icons/v4/payment-local.svg'),
    ('checkout_payment_transfer', 'brand_asset.checkout_payment_transfer.path', 'icons/v3/payment-transfer.svg', 'icons/v4/payment-transfer.svg')
),
stored_previous AS (
  SELECT
    target_icons.slot,
    app_setting.value AS path
  FROM target_icons
  JOIN "AppSetting" app_setting ON app_setting."key" = target_icons.setting_key
  WHERE COALESCE(NULLIF(TRIM(app_setting.value), ''), '') <> ''
    AND TRIM(app_setting.value) <> target_icons.new_path
)
INSERT INTO "BrandAssetVersion" ("id", "slot", "path", "originalName", "mimeType", "size", "isActive", "source", "createdAt")
SELECT
  'v4-prev-' || LEFT(MD5(stored_previous.slot || ':' || stored_previous.path), 18),
  stored_previous.slot,
  stored_previous.path,
  'Version anterior activa',
  'image/svg+xml',
  NULL,
  false,
  'previous',
  CURRENT_TIMESTAMP
FROM stored_previous
WHERE NOT EXISTS (
  SELECT 1
  FROM "BrandAssetVersion" existing
  WHERE existing."slot" = stored_previous.slot
    AND existing."path" = stored_previous.path
)
ON CONFLICT ("id") DO NOTHING;

WITH target_icons(slot, setting_key, previous_default_path, new_path) AS (
  VALUES
    ('icon_settings', 'brand_asset.icon_settings.path', 'icons/v3/settings.svg', 'icons/v4/settings.svg'),
    ('icon_carrito', 'brand_asset.icon_carrito.path', 'icons/v3/carrito.svg', 'icons/v4/carrito.svg'),
    ('icon_logout', 'brand_asset.icon_logout.path', 'icons/v3/logout.svg', 'icons/v4/logout.svg'),
    ('icon_consultar_reparacion', 'brand_asset.icon_consultar_reparacion.path', 'icons/v3/consultar-reparacion.svg', 'icons/v4/consultar-reparacion.svg'),
    ('icon_mis_pedidos', 'brand_asset.icon_mis_pedidos.path', 'icons/v3/mis-pedidos.svg', 'icons/v4/mis-pedidos.svg'),
    ('icon_mis_reparaciones', 'brand_asset.icon_mis_reparaciones.path', 'icons/v3/mis-reparaciones.svg', 'icons/v4/mis-reparaciones.svg'),
    ('icon_dashboard', 'brand_asset.icon_dashboard.path', 'icons/v3/dashboard.svg', 'icons/v4/dashboard.svg'),
    ('icon_tienda', 'brand_asset.icon_tienda.path', 'icons/v3/tienda.svg', 'icons/v4/tienda.svg'),
    ('icon_ayuda', 'brand_asset.icon_ayuda.path', 'icons/v3/ayuda.svg', 'icons/v4/ayuda.svg'),
    ('icon_mi_cuenta', 'brand_asset.icon_mi_cuenta.path', 'icons/v3/mi-cuenta.svg', 'icons/v4/mi-cuenta.svg'),
    ('icon_verificar_correo', 'brand_asset.icon_verificar_correo.path', 'icons/v3/verificar-correo.svg', 'icons/v4/verificar-correo.svg'),
    ('icon_admin_pedidos', 'brand_asset.icon_admin_pedidos.path', 'icons/v3/admin-pedidos.svg', 'icons/v4/admin-pedidos.svg'),
    ('icon_admin_reparaciones', 'brand_asset.icon_admin_reparaciones.path', 'icons/v3/admin-reparaciones.svg', 'icons/v4/admin-reparaciones.svg'),
    ('icon_admin_venta_rapida', 'brand_asset.icon_admin_venta_rapida.path', 'icons/v3/admin-venta-rapida.svg', 'icons/v4/admin-venta-rapida.svg'),
    ('icon_admin_productos', 'brand_asset.icon_admin_productos.path', 'icons/v3/admin-productos.svg', 'icons/v4/admin-productos.svg'),
    ('checkout_payment_local', 'brand_asset.checkout_payment_local.path', 'icons/v3/payment-local.svg', 'icons/v4/payment-local.svg'),
    ('checkout_payment_transfer', 'brand_asset.checkout_payment_transfer.path', 'icons/v3/payment-transfer.svg', 'icons/v4/payment-transfer.svg')
)
INSERT INTO "BrandAssetVersion" ("id", "slot", "path", "originalName", "mimeType", "size", "isActive", "source", "createdAt")
SELECT
  'v4-previous-default-' || LEFT(MD5(target_icons.slot || ':' || target_icons.previous_default_path), 18),
  target_icons.slot,
  target_icons.previous_default_path,
  'Default v3 anterior',
  'image/svg+xml',
  NULL,
  false,
  'default',
  CURRENT_TIMESTAMP
FROM target_icons
WHERE NOT EXISTS (
  SELECT 1
  FROM "BrandAssetVersion" existing
  WHERE existing."slot" = target_icons.slot
    AND existing."path" = target_icons.previous_default_path
)
ON CONFLICT ("id") DO NOTHING;

WITH target_icons(slot) AS (
  VALUES
    ('icon_settings'),
    ('icon_carrito'),
    ('icon_logout'),
    ('icon_consultar_reparacion'),
    ('icon_mis_pedidos'),
    ('icon_mis_reparaciones'),
    ('icon_dashboard'),
    ('icon_tienda'),
    ('icon_ayuda'),
    ('icon_mi_cuenta'),
    ('icon_verificar_correo'),
    ('icon_admin_pedidos'),
    ('icon_admin_reparaciones'),
    ('icon_admin_venta_rapida'),
    ('icon_admin_productos'),
    ('checkout_payment_local'),
    ('checkout_payment_transfer')
)
UPDATE "BrandAssetVersion"
SET "isActive" = false
WHERE "slot" IN (SELECT slot FROM target_icons);

WITH target_icons(slot, setting_key, previous_default_path, new_path) AS (
  VALUES
    ('icon_settings', 'brand_asset.icon_settings.path', 'icons/v3/settings.svg', 'icons/v4/settings.svg'),
    ('icon_carrito', 'brand_asset.icon_carrito.path', 'icons/v3/carrito.svg', 'icons/v4/carrito.svg'),
    ('icon_logout', 'brand_asset.icon_logout.path', 'icons/v3/logout.svg', 'icons/v4/logout.svg'),
    ('icon_consultar_reparacion', 'brand_asset.icon_consultar_reparacion.path', 'icons/v3/consultar-reparacion.svg', 'icons/v4/consultar-reparacion.svg'),
    ('icon_mis_pedidos', 'brand_asset.icon_mis_pedidos.path', 'icons/v3/mis-pedidos.svg', 'icons/v4/mis-pedidos.svg'),
    ('icon_mis_reparaciones', 'brand_asset.icon_mis_reparaciones.path', 'icons/v3/mis-reparaciones.svg', 'icons/v4/mis-reparaciones.svg'),
    ('icon_dashboard', 'brand_asset.icon_dashboard.path', 'icons/v3/dashboard.svg', 'icons/v4/dashboard.svg'),
    ('icon_tienda', 'brand_asset.icon_tienda.path', 'icons/v3/tienda.svg', 'icons/v4/tienda.svg'),
    ('icon_ayuda', 'brand_asset.icon_ayuda.path', 'icons/v3/ayuda.svg', 'icons/v4/ayuda.svg'),
    ('icon_mi_cuenta', 'brand_asset.icon_mi_cuenta.path', 'icons/v3/mi-cuenta.svg', 'icons/v4/mi-cuenta.svg'),
    ('icon_verificar_correo', 'brand_asset.icon_verificar_correo.path', 'icons/v3/verificar-correo.svg', 'icons/v4/verificar-correo.svg'),
    ('icon_admin_pedidos', 'brand_asset.icon_admin_pedidos.path', 'icons/v3/admin-pedidos.svg', 'icons/v4/admin-pedidos.svg'),
    ('icon_admin_reparaciones', 'brand_asset.icon_admin_reparaciones.path', 'icons/v3/admin-reparaciones.svg', 'icons/v4/admin-reparaciones.svg'),
    ('icon_admin_venta_rapida', 'brand_asset.icon_admin_venta_rapida.path', 'icons/v3/admin-venta-rapida.svg', 'icons/v4/admin-venta-rapida.svg'),
    ('icon_admin_productos', 'brand_asset.icon_admin_productos.path', 'icons/v3/admin-productos.svg', 'icons/v4/admin-productos.svg'),
    ('checkout_payment_local', 'brand_asset.checkout_payment_local.path', 'icons/v3/payment-local.svg', 'icons/v4/payment-local.svg'),
    ('checkout_payment_transfer', 'brand_asset.checkout_payment_transfer.path', 'icons/v3/payment-transfer.svg', 'icons/v4/payment-transfer.svg')
)
INSERT INTO "BrandAssetVersion" ("id", "slot", "path", "originalName", "mimeType", "size", "isActive", "source", "createdAt")
SELECT
  'v4-active-' || LEFT(MD5(target_icons.slot || ':' || target_icons.new_path), 18),
  target_icons.slot,
  target_icons.new_path,
  'Default v4 monocromo',
  'image/svg+xml',
  NULL,
  true,
  'default',
  CURRENT_TIMESTAMP
FROM target_icons
ON CONFLICT ("id") DO UPDATE SET
  "isActive" = true,
  "path" = EXCLUDED."path",
  "originalName" = EXCLUDED."originalName",
  "source" = EXCLUDED."source";

WITH target_icons(slot, setting_key, previous_default_path, new_path) AS (
  VALUES
    ('icon_settings', 'brand_asset.icon_settings.path', 'icons/v3/settings.svg', 'icons/v4/settings.svg'),
    ('icon_carrito', 'brand_asset.icon_carrito.path', 'icons/v3/carrito.svg', 'icons/v4/carrito.svg'),
    ('icon_logout', 'brand_asset.icon_logout.path', 'icons/v3/logout.svg', 'icons/v4/logout.svg'),
    ('icon_consultar_reparacion', 'brand_asset.icon_consultar_reparacion.path', 'icons/v3/consultar-reparacion.svg', 'icons/v4/consultar-reparacion.svg'),
    ('icon_mis_pedidos', 'brand_asset.icon_mis_pedidos.path', 'icons/v3/mis-pedidos.svg', 'icons/v4/mis-pedidos.svg'),
    ('icon_mis_reparaciones', 'brand_asset.icon_mis_reparaciones.path', 'icons/v3/mis-reparaciones.svg', 'icons/v4/mis-reparaciones.svg'),
    ('icon_dashboard', 'brand_asset.icon_dashboard.path', 'icons/v3/dashboard.svg', 'icons/v4/dashboard.svg'),
    ('icon_tienda', 'brand_asset.icon_tienda.path', 'icons/v3/tienda.svg', 'icons/v4/tienda.svg'),
    ('icon_ayuda', 'brand_asset.icon_ayuda.path', 'icons/v3/ayuda.svg', 'icons/v4/ayuda.svg'),
    ('icon_mi_cuenta', 'brand_asset.icon_mi_cuenta.path', 'icons/v3/mi-cuenta.svg', 'icons/v4/mi-cuenta.svg'),
    ('icon_verificar_correo', 'brand_asset.icon_verificar_correo.path', 'icons/v3/verificar-correo.svg', 'icons/v4/verificar-correo.svg'),
    ('icon_admin_pedidos', 'brand_asset.icon_admin_pedidos.path', 'icons/v3/admin-pedidos.svg', 'icons/v4/admin-pedidos.svg'),
    ('icon_admin_reparaciones', 'brand_asset.icon_admin_reparaciones.path', 'icons/v3/admin-reparaciones.svg', 'icons/v4/admin-reparaciones.svg'),
    ('icon_admin_venta_rapida', 'brand_asset.icon_admin_venta_rapida.path', 'icons/v3/admin-venta-rapida.svg', 'icons/v4/admin-venta-rapida.svg'),
    ('icon_admin_productos', 'brand_asset.icon_admin_productos.path', 'icons/v3/admin-productos.svg', 'icons/v4/admin-productos.svg'),
    ('checkout_payment_local', 'brand_asset.checkout_payment_local.path', 'icons/v3/payment-local.svg', 'icons/v4/payment-local.svg'),
    ('checkout_payment_transfer', 'brand_asset.checkout_payment_transfer.path', 'icons/v3/payment-transfer.svg', 'icons/v4/payment-transfer.svg')
)
INSERT INTO "AppSetting" ("id", "key", "value", "group", "label", "type", "createdAt", "updatedAt")
SELECT
  'setting-v4-' || LEFT(MD5(target_icons.setting_key), 18),
  target_icons.setting_key,
  target_icons.new_path,
  'branding_assets',
  target_icons.setting_key,
  'text',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM target_icons
ON CONFLICT ("key") DO UPDATE SET
  "value" = EXCLUDED."value",
  "updatedAt" = CURRENT_TIMESTAMP;
