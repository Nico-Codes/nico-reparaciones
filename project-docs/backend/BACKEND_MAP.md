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
  - `providers` ahora se organiza como facade + registry + search orchestration + helpers de parsing/ranking
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

- `admin-provider-search.service.ts` ya bajo a una fachada chica y la complejidad de scraping quedo seccionada en helpers especificos.
- El siguiente hotspot backend por servicio vuelve a ser `catalog-admin.service.ts`, porque sigue mezclando catalogo comercial, assets y operaciones admin en un solo archivo.
- El hotspot mas grande del repo completo sigue estando en frontend: `RepairProviderPartPricingSection.tsx`.
- Recomendacion prioritaria: si seguimos bajando complejidad del backend, conviene partir `catalog-admin.service.ts` antes de abrir otra ola transversal.
