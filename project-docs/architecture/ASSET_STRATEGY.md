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

## Resolucion publica de URLs

- los assets de branding y auth que viven en `apps/web/public` deben resolverse como rutas publicas de la web (`/brand/...`, `/brand-assets/...`, `/icons/...`, `/favicon...`)
- `STORE_IMAGE_BASE_URL` queda reservado para assets legacy de `storage/` y no debe prefijarse sobre branding, hero ni fondos de auth
- si un asset de identidad visual no tiene archivo configurado, la UI admin debe mostrarlo como vacio y no simular una imagen real que todavia no existe
- el fondo de auth tiene un fallback por defecto en `brand/logo-bg.png` para que el login no quede sin imagen mientras el slot todavia no fue personalizado
