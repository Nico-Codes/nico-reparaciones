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

## Seguridad

- `JwtAuthGuard`
- `RolesGuard`
- roles `USER` y `ADMIN`
- throttling, logging, health endpoints, correo SMTP y 2FA admin

## Observacion clave

No existe ya backend legacy dentro del repo. Todo comportamiento servidor activo parte de `next-stack/apps/api`.
