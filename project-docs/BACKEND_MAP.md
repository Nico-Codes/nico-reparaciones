# BACKEND_MAP

## Base del backend

Ubicacion operativa:

- `next-stack/apps/api`

Entrypoint:

- `next-stack/apps/api/src/main.ts`

Modulo raiz:

- `next-stack/apps/api/src/modules/app.module.ts`

## Modulos cargados en AppModule

Confirmados:

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

## Controllers principales y responsabilidades

### HealthController

Responsabilidad:

- health check, liveness, readiness e info

Endpoints:

- `GET /api/health`
- `GET /api/health/live`
- `GET /api/health/ready`
- `GET /api/health/info`

### AuthController

Responsabilidad:

- registro, login, refresh, verify email, reset password, cuenta, bootstrap admin

Endpoints principales:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/verify-email/request`
- `POST /api/auth/verify-email/confirm`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/bootstrap-admin`
- `GET /api/auth/me`
- `GET /api/auth/account`
- `PATCH /api/auth/account`
- `PATCH /api/auth/account/password`

### StoreController

Responsabilidad:

- tienda publica, categorias, branding y detalle de producto

### CartController

Responsabilidad:

- quote de carrito

### OrdersController

Responsabilidad:

- checkout, pedidos del usuario, pedidos admin y ventas rapidas

### RepairsController

Responsabilidad:

- lookup publico de reparaciones
- aprobacion/rechazo de presupuesto
- reparaciones del usuario
- reparaciones admin, stats y cambios de estado

### PricingController

Responsabilidad:

- reglas de pricing de reparaciones
- resolucion de precio

### CatalogAdminController

Responsabilidad:

- categorias, productos, imagenes y pricing de productos

### DeviceCatalogController

Responsabilidad:

- marcas, modelos y fallas del catalogo tecnico

### AdminController

Responsabilidad transversal:

- dashboard
- users y roles
- settings
- SMTP
- device types y model groups
- providers
- warranties
- accounting
- reportes
- templates mail/WhatsApp
- help FAQ
- 2FA
- brand assets

## Servicios y responsabilidades sensibles

### `admin.service.ts`

Observacion confirmada:

- es el servicio mas grande del backend actual
- tamano aproximado detectado: 97 KB

Responsabilidades observables:

- dashboard
- settings
- templates
- providers
- warranties
- accounting
- 2FA
- uploads y reset de brand assets

Es un punto sensible para futura limpieza o modularizacion, pero no debe tocarse sin plan especifico.

### `catalog-admin.service.ts`

Responsabilidades:

- CRUD de productos y categorias
- pricing de productos
- manejo de imagenes
- resolucion de `apps/web/public`

### `orders.service.ts`

Responsabilidades:

- checkout
- pedidos del usuario y admin
- ventas rapidas
- reglas de precio relacionadas a productos

### `repairs.service.ts`

Responsabilidades:

- lookup publico
- flujo admin de reparaciones
- stats
- logs de eventos

### `mail.service.ts`

Responsabilidades:

- envio por SMTP
- fallback local/log
- soporte a verify/reset/order mails

## Auth, guards y roles

Roles confirmados en Prisma:

- `USER`
- `ADMIN`

Piezas confirmadas:

- `jwt-auth.guard.ts`
- `roles.guard.ts`
- `roles.decorator.ts`
- `current-user.decorator.ts`

Seguridad global:

- throttling via `APP_GUARD` con `ThrottlerGuard`
- `helmet`
- `ValidationPipe` global
- filtros globales de excepcion
- request id por request

## Estrategia real de validacion

Confirmado por codigo:

- `ValidationPipe` global de Nest en `main.ts`
- `ZodValidationPipe` aplicado en auth
- varios controllers usan `zod` manualmente dentro del metodo

Conclusion:

- la validacion actual es mixta
- no conviene documentarla como Zod-only

## Prisma y entidades centrales

Schema:

- `next-stack/apps/api/prisma/schema.prisma`

Entidades principales:

- `User`
- `EmailVerificationToken`
- `PasswordResetToken`
- `RefreshToken`
- `Category`
- `Product`
- `ProductPricingRule`
- `Order`
- `OrderItem`
- `Repair`
- `RepairEventLog`
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

## Scripts Prisma relevantes

- `db-check.ts`
- `seed.ts`
- `fix-mojibake.ts`
- `migrate-legacy-settings.ts`
- `migrate-legacy-product-images.ts`
- `migrate-legacy-visual-assets.ts`

Esto confirma que el backend todavia conserva herramientas de migracion desde el legacy.

## Modulos o zonas de mayor complejidad

Sensibilidad alta:

- `modules/admin/admin.service.ts`
- `modules/catalog-admin/catalog-admin.service.ts`
- `modules/orders/orders.service.ts`
- `modules/repairs/repairs.service.ts`
- `prisma/schema.prisma`
- scripts `migrate-legacy-*`

## Hallazgos relevantes para auditoria futura

- `packages/contracts` existe, pero su alcance confirmado es chico: health + auth principalmente
- `apps/api/package.json` ya no tiene duplicacion de `dotenv-cli`; quedo alineado con el lockfile en Fase 3
- el backend usa `load-canonical-env.ts` para cargar `next-stack/.env` como unica fuente viva; `apps/api/.env` fue retirado en Fase 3

