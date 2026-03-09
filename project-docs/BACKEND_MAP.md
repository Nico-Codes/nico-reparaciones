# BACKEND_MAP

## Base del backend

Ubicacion operativa:

- `next-stack/apps/api`

Entrypoint:

- `next-stack/apps/api/src/main.ts`

Modulo raiz:

- `next-stack/apps/api/src/modules/app.module.ts`

## Modulos cargados en AppModule

- `PrismaModule`
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

## Controllers principales

- `HealthController`
- `AuthController`
- `StoreController`
- `CartController`
- `OrdersController`
- `RepairsController`
- `PricingController`
- `CatalogAdminController`
- `DeviceCatalogController`
- `AdminController`

## Auth, guards y roles

Roles confirmados:

- `USER`
- `ADMIN`

Piezas confirmadas:

- `jwt-auth.guard.ts`
- `roles.guard.ts`
- `roles.decorator.ts`
- `current-user.decorator.ts`

## Prisma y entidades centrales

Schema:

- `next-stack/apps/api/prisma/schema.prisma`

Entidades principales:

- `User`
- `RefreshToken`
- `Category`
- `Product`
- `Order`
- `OrderItem`
- `Repair`
- `RepairPricingRule`
- `DeviceType`
- `DeviceBrand`
- `DeviceModel`
- `DeviceIssueType`
- `DeviceModelGroup`
- `Supplier`
- `WarrantyIncident`
- `AppSetting`
- `WhatsAppLog`
- `HelpFaqItem`

## Scripts Prisma y soporte legacy

Operativos:

- `db-check.ts`
- `seed.ts`
- `fix-mojibake.ts`

Tooling legacy archivado:

- `next-stack/legacy-support/deprecated/api/migrate-legacy-settings.ts`
- `next-stack/legacy-support/deprecated/api/migrate-legacy-product-images.ts`
- `next-stack/legacy-support/deprecated/api/migrate-legacy-visual-assets.ts`

## Lectura tecnica actual

- El backend nuevo es autosuficiente para runtime normal.
- La capa legacy de migracion ya no forma parte del flujo operativo diario.
- El siguiente retiro fuerte del legado no depende del backend Nest, sino del runtime/root legacy restante.
