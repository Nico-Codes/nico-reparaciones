WITH target_icons(slot, setting_key, previous_default_path, new_path) AS (
  VALUES
    ('icon_consultar_reparacion', 'brand_asset.icon_consultar_reparacion.path', 'icons/v4/consultar-reparacion.svg', 'icons/v5/consultar-reparacion.svg'),
    ('icon_mis_reparaciones', 'brand_asset.icon_mis_reparaciones.path', 'icons/v4/mis-reparaciones.svg', 'icons/v5/mis-reparaciones.svg'),
    ('icon_admin_reparaciones', 'brand_asset.icon_admin_reparaciones.path', 'icons/v4/admin-reparaciones.svg', 'icons/v5/admin-reparaciones.svg'),
    ('icon_verificar_correo', 'brand_asset.icon_verificar_correo.path', 'icons/v4/verificar-correo.svg', 'icons/v5/verificar-correo.svg')
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
  'v5-prev-' || LEFT(MD5(stored_previous.slot || ':' || stored_previous.path), 18),
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
    ('icon_consultar_reparacion', 'brand_asset.icon_consultar_reparacion.path', 'icons/v4/consultar-reparacion.svg', 'icons/v5/consultar-reparacion.svg'),
    ('icon_mis_reparaciones', 'brand_asset.icon_mis_reparaciones.path', 'icons/v4/mis-reparaciones.svg', 'icons/v5/mis-reparaciones.svg'),
    ('icon_admin_reparaciones', 'brand_asset.icon_admin_reparaciones.path', 'icons/v4/admin-reparaciones.svg', 'icons/v5/admin-reparaciones.svg'),
    ('icon_verificar_correo', 'brand_asset.icon_verificar_correo.path', 'icons/v4/verificar-correo.svg', 'icons/v5/verificar-correo.svg')
)
INSERT INTO "BrandAssetVersion" ("id", "slot", "path", "originalName", "mimeType", "size", "isActive", "source", "createdAt")
SELECT
  'v5-previous-default-' || LEFT(MD5(target_icons.slot || ':' || target_icons.previous_default_path), 18),
  target_icons.slot,
  target_icons.previous_default_path,
  'Default v4 anterior',
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
    ('icon_consultar_reparacion'),
    ('icon_mis_reparaciones'),
    ('icon_admin_reparaciones'),
    ('icon_verificar_correo')
)
UPDATE "BrandAssetVersion"
SET "isActive" = false
WHERE "slot" IN (SELECT slot FROM target_icons);

WITH target_icons(slot, setting_key, previous_default_path, new_path) AS (
  VALUES
    ('icon_consultar_reparacion', 'brand_asset.icon_consultar_reparacion.path', 'icons/v4/consultar-reparacion.svg', 'icons/v5/consultar-reparacion.svg'),
    ('icon_mis_reparaciones', 'brand_asset.icon_mis_reparaciones.path', 'icons/v4/mis-reparaciones.svg', 'icons/v5/mis-reparaciones.svg'),
    ('icon_admin_reparaciones', 'brand_asset.icon_admin_reparaciones.path', 'icons/v4/admin-reparaciones.svg', 'icons/v5/admin-reparaciones.svg'),
    ('icon_verificar_correo', 'brand_asset.icon_verificar_correo.path', 'icons/v4/verificar-correo.svg', 'icons/v5/verificar-correo.svg')
)
INSERT INTO "BrandAssetVersion" ("id", "slot", "path", "originalName", "mimeType", "size", "isActive", "source", "createdAt")
SELECT
  'v5-active-' || LEFT(MD5(target_icons.slot || ':' || target_icons.new_path), 18),
  target_icons.slot,
  target_icons.new_path,
  'Default v5 seleccionado',
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
    ('icon_consultar_reparacion', 'brand_asset.icon_consultar_reparacion.path', 'icons/v4/consultar-reparacion.svg', 'icons/v5/consultar-reparacion.svg'),
    ('icon_mis_reparaciones', 'brand_asset.icon_mis_reparaciones.path', 'icons/v4/mis-reparaciones.svg', 'icons/v5/mis-reparaciones.svg'),
    ('icon_admin_reparaciones', 'brand_asset.icon_admin_reparaciones.path', 'icons/v4/admin-reparaciones.svg', 'icons/v5/admin-reparaciones.svg'),
    ('icon_verificar_correo', 'brand_asset.icon_verificar_correo.path', 'icons/v4/verificar-correo.svg', 'icons/v5/verificar-correo.svg')
)
INSERT INTO "AppSetting" ("id", "key", "value", "group", "label", "type", "createdAt", "updatedAt")
SELECT
  'setting-v5-' || LEFT(MD5(target_icons.setting_key), 18),
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
