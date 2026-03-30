# ARCHITECTURE

## Arquitectura general actual

La arquitectura confirmada por el codigo es desacoplada:

- frontend SPA en React: `next-stack/apps/web`
- backend API REST en NestJS: `next-stack/apps/api`
- persistencia con Prisma + PostgreSQL
- assets y branding dinamico servidos desde `apps/web/public` y settings en DB

El backend expone API bajo prefijo global `/api`.

## Entry points principales

Frontend:

- `next-stack/apps/web/src/main.tsx`
- `next-stack/apps/web/src/App.tsx`
- router con `BrowserRouter`

Backend:

- `next-stack/apps/api/src/main.ts`
- `next-stack/apps/api/src/modules/app.module.ts`

## Relacion entre frontend, backend, DB y settings dinamicos

1. El usuario entra a una ruta React.
2. `App.tsx` resuelve la pantalla y aplica guards si corresponde.
3. La pantalla consume clientes API por feature (`features/*/api.ts` o `auth/http.ts`).
4. NestJS enruta la request al modulo correspondiente.
5. El modulo aplica auth, roles, throttling y validacion.
6. Prisma accede a PostgreSQL.
7. El backend devuelve JSON.
8. React actualiza la UI.

Ademas existe una capa de configuracion dinamica via `AppSetting` que afecta:

- branding publico
- hero de tienda
- datos del negocio
- templates de mail
- templates de WhatsApp
- ajustes operativos de admin

## Flujos principales

### Tienda

Frontend:

- `/store`
- `/store/:slug`
- `/cart`
- `/checkout`

Backend:

- `GET /api/store/categories`
- `GET /api/store/hero`
- `GET /api/store/branding`
- `GET /api/store/products`
- `GET /api/store/products/:slug`
- `POST /api/cart/quote`
- `POST /api/orders/checkout`

Dependencias:

- productos
- categorias
- pricing de productos
- branding publico
- auth para checkout

### Auth

Frontend:

- `/auth/login`
- `/auth/register`
- `/auth/verify-email`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/mi-cuenta`

Backend:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/verify-email/request`
- `POST /api/auth/verify-email/confirm`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`
- `GET /api/auth/account`
- `PATCH /api/auth/account`
- `PATCH /api/auth/account/password`

Notas tecnicas:

- auth en frontend se persiste en `localStorage`
- eventos de sincronizacion: `nico:auth-changed`
- `RequireAuth` y `RequireAdmin` protegen rutas

### Pedidos

Frontend:

- `/orders`
- `/orders/:id`
- `/admin/orders`
- `/admin/orders/:id`
- rutas print/ticket admin
- ventas rapidas admin

Backend:

- `GET /api/orders/my`
- `GET /api/orders/my/:id`
- `GET /api/orders/admin`
- `GET /api/orders/admin/:id`
- `PATCH /api/orders/admin/:id/status`
- `GET /api/orders/admin/quick-sales`
- `POST /api/orders/admin/quick-sales/confirm`

### Reparaciones

Frontend:

- `/reparacion`
- `/reparacion/:id/presupuesto`
- `/repairs`
- `/repairs/:id`
- `/admin/repairs`
- `/admin/repairs/:id`
- rutas print/ticket admin

Backend:

- `POST /api/repairs/lookup`
- `GET /api/repairs/:id/quote-approval`
- `POST /api/repairs/:id/quote-approval/approve`
- `POST /api/repairs/:id/quote-approval/reject`
- `GET /api/repairs/my`
- `GET /api/repairs/my/:id`
- `GET /api/repairs/admin`
- `GET /api/repairs/admin/stats`
- `GET /api/repairs/admin/:id`
- `POST /api/repairs/admin`
- `PATCH /api/repairs/admin/:id/status`
- `PATCH /api/repairs/admin/:id`

### Admin general

La superficie admin concentra varios submodulos bajo `/admin/*`.

Puntos de integracion sensibles:

- dashboard reutilizado por alertas
- settings usados por branding y textos publicos
- templates mail/WhatsApp dependen de DB y configuracion
- proveedores y garantias se cruzan con productos y reparaciones
- pricing se cruza con catalogo tecnico y catalogo comercial

## Dependencias operativas entre modulos

Dependencias fuertes:

- `AuthModule` -> protege usuario y admin
- `AdminModule` -> depende de `AppSetting`, usuarios, templates, providers, warranties y branding
- `StoreModule` -> depende de productos, categorias y branding
- `OrdersModule` -> depende de auth, productos, pricing y stock
- `RepairsModule` -> depende de auth, device catalog, pricing y event logs
- `CatalogAdminModule` -> depende de categorias, productos, proveedores y assets
- `PricingModule` -> depende de device catalog y reglas de negocio
- `DeviceCatalogModule` -> alimenta repairs y pricing

## Settings dinamicos y branding

Confirmado por codigo:

- `BrandingHeadSync` sincroniza parte del head del sitio
- `AdminVisualIdentityPage` y `AdminStoreHeroSettingsPage` gestionan assets y hero
- `main.ts` del API sirve assets estaticos desde `apps/web/public` si la carpeta existe
- `admin.service.ts` y `catalog-admin.service.ts` resuelven `apps/web/public` para uploads/brand assets

## Validacion y seguridad

Validacion real confirmada:

- estrategia mixta, no unicamente Zod
- `ValidationPipe` global en `main.ts`
- `ZodValidationPipe` en auth
- validacion manual con `zod` en varios controllers

Seguridad confirmada:

- JWT
- refresh tokens
- guards por auth y rol
- throttling global
- helmet
- CORS configurable
- request-id y logs

## Puntos sensibles de integracion

- `App.tsx` concentra gran parte del mapa de rutas y aliases legacy
- `AppShell.tsx` concentra navegacion, cuenta, navbar y comportamiento responsive
- `admin.service.ts` es el servicio mas grande y transversal del backend
- `catalog-admin.service.ts` y `admin.service.ts` escriben en `apps/web/public`
- scripts de migracion y visual parity todavia dependen del repo root legacy
