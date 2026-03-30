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

- `AdminModule` sigue siendo el punto backend mas grande despues de las particiones previas, pero ya sin providers, communications ni finance mezclados en la fachada.
- El siguiente corte recomendado dentro de `admin.service.ts` es `security` + `help/content`, porque ahora quedan como bloques chicos pero todavia transversales dentro del admin.
