# ASSET_STRATEGY

## Fuente canonica

La unica fuente canonica de assets visuales es:

- `next-stack/apps/web/public`

## Estado actual

- `public/` root fue retirado.
- no existe mirror legacy de assets en la raiz.
- parity y tooling legacy ya no usan ni sincronizan assets root.

## Regla de mantenimiento

- agregar, editar o reemplazar assets solo en `next-stack/apps/web/public`
- no recrear capas de sync o mirrors fuera del canon
- si se necesita snapshot historico puntual, usar control de versiones o backups externos

## Encapsulacion operativa actual

- aunque el destino sigue siendo `next-stack/apps/web/public`, la escritura ya no debe resolverse manualmente desde cada servicio
- la capa canonica para uploads/borrado/urls locales es `next-stack/apps/api/src/common/storage/public-asset-storage.service.ts`
- `AdminBrandAssetsService` usa esa capa para branding y `CatalogAdminService` para imagenes de producto
- el fondo visual del login tambien se administra como asset de branding desde `AdminVisualIdentityPage` con dos variantes (`desktop` y `mobile`) y se expone al frontend publico via `/api/store/branding` para renderizarse como imagen real del panel visual de auth
- esto permite mantener el storage local actual sin seguir mezclando logica de paths y validacion de archivos dentro de servicios de dominio
