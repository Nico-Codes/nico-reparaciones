# BACKEND_MAP

## Backend operativo

Ubicacion:
- `next-stack/apps/api`

## Modulos principales cargados

- `HealthModule`
- `HelpModule`
- `MailModule`
- `AuthModule`
- `AdminModule`
- `CartModule`
- `CatalogAdminModule`
- `DeviceCatalogModule`
- `OrdersModule`
- `PricingModule`
- `RepairsModule`
- `StoreModule`
- `PrismaModule`

## Modulos internos ya seccionados

- `AdminModule`
  - facade principal en `admin.service.ts`
  - subservicios activos para dashboard, settings, brand assets, communications, finance, warranty registry y providers
  - `providers` ahora se organiza como facade + registry + search/scraping
- `RepairsModule`
  - facade principal en `repairs.service.ts`
  - subservicios activos para flujo admin, flujo publico, pricing snapshots, timeline, notificaciones y soporte/serializacion
- `OrdersModule`
  - facade principal en `orders.service.ts`
  - subservicios activos para checkout/mis pedidos, flujo admin, ventas rapidas, notificaciones y soporte/serializacion

## Seguridad

- `JwtAuthGuard`
- `RolesGuard`
- roles `USER` y `ADMIN`
- throttling, logging, health endpoints, correo SMTP y 2FA admin

## Observacion clave

No existe ya backend legacy dentro del repo. Todo comportamiento servidor activo parte de `next-stack/apps/api`.

## Hotspot actual recomendado

- `admin.service.ts` ya bajo a una fachada razonablemente chica.
- El hotspot backend mas grande del repo paso a ser `admin-provider-search.service.ts`, porque concentra scraping HTML/JSON, normalizacion, ranking y heuristicas de proveedores.
- El siguiente corte recomendado es separar `admin-provider-search.service.ts` en parser/extractor/ranking helpers, antes de pasar a hotspots grandes del frontend como `RepairProviderPartPricingSection.tsx`.
