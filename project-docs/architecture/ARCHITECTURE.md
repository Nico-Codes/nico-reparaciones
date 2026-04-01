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
- la escritura local de assets ahora pasa por `PublicAssetStorageService`
- `AdminService` delega branding, settings, dashboard y providers a subservicios especificos en vez de concentrar todo en un solo archivo

## Orden interno reforzado

- `AdminProductPricingRulesPage.tsx` ya no concentra preferencias, simulador, alta y edicion inline de reglas en un solo archivo
- el feature de pricing comercial ahora se reparte entre:
  - `admin-product-pricing-rules.helpers.ts`
  - `admin-product-pricing-rules.sections.tsx`
- la pagina principal queda centrada en:
  - carga de preferencias, categorias y productos
  - sincronizacion del simulador
  - alta de reglas
  - patches inline y borrado
- la logica de mapping, filtros de alcance y armado de payloads queda fuera del render principal
- `AdminRepairPricingRulesPage.tsx` ya no concentra scope editable, payloads y la grilla completa de reglas en un solo archivo
- el feature de pricing de reparaciones ahora se reparte entre:
  - `admin-repair-pricing-rules.helpers.ts`
  - `admin-repair-pricing-rules.sections.tsx`
- la pagina principal queda centrada en:
  - carga de reglas y catalogo tecnico
  - sincronizacion de nombres/lookups
  - patches de estado
  - guardado y borrado
- la logica de scope, filtros dependientes y armado del patch queda fuera del render principal
- `AdminDashboardPage.tsx` ya no concentra resumen, bandeja y actividad del panel en un solo archivo
- el dashboard admin ahora se reparte entre:
  - `admin-dashboard.helpers.ts`
  - `admin-dashboard.sections.tsx`
- la pagina principal queda centrada en:
  - fetch del dashboard
  - estado de carga y error
  - composicion del summary y work queue
  - ensamblado de secciones
- la logica de metricas, contadores y prioridad operativa queda fuera del render principal
- `StorePage.tsx` ya no concentra hero, filtros, sort mobile, resultados y cards en un solo archivo
- la tienda publica ahora se reparte entre:
  - `store-page.helpers.ts`
  - `store-page.sections.tsx`
- la pagina principal queda centrada en:
  - fetch de hero, categorias y productos
  - sincronizacion de query params
  - control del sheet mobile de ordenamiento
  - ensamblado del toolbar y resultados
- la logica de query params, etiquetas derivadas y visual vars del hero queda fuera del render principal
- `AdminCategoriesPage.tsx` ya no concentra slugify, stats, listado y formulario del CRUD en un solo archivo
- el CRUD de categorias ahora se reparte entre:
  - `admin-categories.helpers.ts`
  - `admin-categories.sections.tsx`
- la pagina principal queda centrada en:
  - fetch del listado
  - sync de create/edit por ruta
  - mutaciones de alta, edicion, toggle y borrado
  - ensamblado de alertas, listado y formulario
- la logica de slug, filtros, stats y diff del draft queda fuera del render principal
- `AdminProductsPage.tsx` ya no concentra stats, filtros, listado y patches rapidos del catalogo en un solo archivo
- el catalogo operativo de productos ahora se reparte entre:
  - `admin-products.helpers.ts`
  - `admin-products.sections.tsx`
- la pagina principal queda centrada en:
  - fetch de categorias y productos
  - sync de filtros
  - patches rapidos de stock, estado y destacado
  - ensamblado de stats, toolbar y listado
- la logica de stats, filtros client-side, opciones y resumen de precio/margen queda fuera del render principal
- `AdminStoreHeroSettingsPage.tsx` ya no concentra metadata de assets, conversiones RGB/HEX, cards de upload y formulario visual en un solo archivo
- el feature de portada de tienda ahora se reparte entre:
  - `admin-store-hero-settings.helpers.ts`
  - `admin-store-hero-settings.sections.tsx`
- la pagina principal queda centrada en:
  - fetch de settings
  - sincronizacion del formulario de portada
  - guardado del payload
  - upload y reset de imagenes
- la logica de metadata, conversion de color y bloques visuales queda fuera del render principal
- `AdminAutoReportsPage.tsx` ya no concentra constantes, payloads, estado derivado e historial operativo en un solo archivo
- el feature de reportes automaticos ahora se reparte entre:
  - `admin-auto-reports.helpers.ts`
  - `admin-auto-reports.sections.tsx`
- la pagina principal queda centrada en:
  - fetch de settings
  - sincronizacion del formulario de reportes
  - guardado de configuracion
  - envio manual de reporte y alertas
  - recarga y limpieza del historial operativo
- la logica de defaults, normalizacion del anti-spam, payloads y resumenes queda fuera del render principal
- `AdminVisualIdentityPage.tsx` ya no concentra metadata de assets, resolucion de paths, previews y cards de upload en un solo archivo
- el feature de identidad visual ahora se reparte entre:
  - `admin-visual-identity.helpers.ts`
  - `admin-visual-identity.sections.tsx`
- la pagina principal queda centrada en:
  - fetch de settings
  - upload y reset de assets
  - sync del archivo seleccionado por slot
  - composicion del layout visual
- la logica de paths, accept list y previews queda fuera del render principal
- `AdminBusinessSettingsPage.tsx` ya no concentra defaults, hydrate/save, sidebar y acciones del negocio en un solo archivo
- el feature de datos del negocio ahora se reparte entre:
  - `admin-business-settings.helpers.ts`
  - `admin-business-settings.sections.tsx`
- la pagina principal queda centrada en:
  - fetch de settings
  - sincronizacion del formulario base
  - guardado y cancelacion de cambios
  - composicion de feedback, sidebar y acciones
- la logica de defaults, payloads y dirty detection queda fuera del render principal
- `AdminWarrantyCreatePage.tsx` ya no concentra lookups, defaults, payloads y el formulario completo en un solo archivo
- el feature de alta de garantias ahora se reparte entre:
  - `admin-warranty-create.helpers.ts`
  - `admin-warranty-create.sections.tsx`
- la pagina principal queda centrada en:
  - fetch de reparaciones, proveedores y productos
  - sincronizacion del formulario y la reparacion seleccionada
  - guardado del incidente
  - navegacion de cierre
- la logica de defaults, opciones, costo derivado y payload de garantia queda fuera del render principal
- `AdminWarrantiesPage.tsx` ya no concentra filtros, cards de resumen, top de proveedores y la tabla completa en un solo archivo
- el listado admin de garantias ahora se reparte entre:
  - `admin-warranties.helpers.ts`
  - `admin-warranties.sections.tsx`
- la pagina principal queda centrada en:
  - fetch del listado y resumen
  - refresh manual de filtros
  - cierre de incidentes
  - composicion de hero, feedback, cards, top supplier y tabla
- la logica de query, formato monetario, labels derivados y estilos de estado queda fuera del render principal
- `AdminWhatsappPage.tsx` ya no concentra defaults, hydrate/save de templates, variables y logs en un solo archivo
- el feature admin de WhatsApp ahora se reparte entre:
  - `admin-whatsapp.helpers.ts`
  - `admin-whatsapp.sections.tsx`
- la pagina principal queda centrada en:
  - fetch de plantillas
  - fetch y refresh del historial reciente
  - guardado de templates
  - composicion de variables, editor y logs
- la logica de defaults, orden canonico de templates y sanitizacion de logs queda fuera del render principal
- `CheckoutPage.tsx` ya no concentra quote del carrito, normalizacion local, estados vacios y el resumen final en un solo archivo
- el feature de checkout ahora se reparte entre:
  - `checkout.helpers.ts`
  - `checkout.sections.tsx`
- la pagina principal queda centrada en:
  - fetch del quote del carrito
  - sincronizacion del metodo de pago
  - confirmacion del pedido
  - limpieza del carrito y navegacion al detalle
- la logica de normalizacion del carrito, estados vacios, formatos y bloques visuales queda fuera del render principal
- `MyAccountPage.tsx` ya no concentra validaciones, drafts de perfil/contrasena y el render completo de la cuenta en un solo archivo
- el feature de cuenta ahora se reparte entre:
  - `my-account.helpers.ts`
  - `my-account.sections.tsx`
- la pagina principal queda centrada en:
  - fetch del perfil autenticado
  - guardado del perfil
  - sincronizacion de `authStorage`
  - cambio de contrasena
- la logica de normalizacion, validacion y bloques visuales de perfil/seguridad queda fuera del render principal
- `CartPage.tsx` ya no concentra quote, normalizacion de stock/cantidades y el render completo del carrito en un solo archivo
- el feature de carrito ahora se reparte entre:
  - `cart.helpers.ts`
  - `cart.sections.tsx`
- la pagina principal queda centrada en:
  - fetch del quote del carrito
  - normalizacion de items validos
  - calculo de stock issue
  - navegacion al checkout
- la logica de formato, stock, cantidades y bloques visuales del carrito queda fuera del render principal
- `StoreProductDetailPage.tsx` ya no concentra formato de precio, stock, cantidad y el render completo del detalle publico en un solo archivo
- el feature de detalle publico ahora se reparte entre:
  - `store-product-detail.helpers.ts`
  - `store-product-detail.sections.tsx`
- la pagina principal queda centrada en:
  - fetch del producto por slug
  - sincronizacion de la cantidad segun stock
  - alta al carrito
  - composicion del detalle visual
- la logica de formato, stock, labels de disponibilidad y bloques visuales queda fuera del render principal
- `AdminRepairsListPage.tsx` ya no concentra filtros, stats, formato de fechas/precios y el render completo del listado tecnico en un solo archivo
- el listado admin de reparaciones ahora se reparte entre:
  - `admin-repairs-list.helpers.ts`
  - `admin-repairs-list.sections.tsx`
- la pagina principal queda centrada en:
  - fetch del listado admin
  - sincronizacion de texto y estado
  - composicion del hero, metricas y mesa operativa
- la logica de filtros, labels comerciales, origen y bloques visuales queda fuera del render principal
- `AdminDevicesCatalogPage.tsx` ya no concentra slugify, filtros, opciones y los tres bloques del catalogo tecnico en un solo archivo
- el feature de catalogo tecnico ahora se reparte entre:
  - `admin-devices-catalog.helpers.ts`
  - `admin-devices-catalog.sections.tsx`
- la pagina principal queda centrada en:
  - fetch de tipos, marcas, modelos y fallas
  - sincronizacion de filtros por tipo y marca
  - mutaciones de alta, rename y toggle
  - composicion de las tres columnas operativas
- la logica de slugify, opciones y filtros de modelos queda fuera del render principal
- `AdminOrderDetailPage.tsx` ya no concentra metricas, alertas, seguimiento, listado de lineas y sidebar operativo en un solo archivo
- el detalle admin de pedidos ahora se reparte entre:
  - `admin-order-detail.helpers.ts`
  - `admin-order-detail.sections.tsx`
- la pagina principal queda centrada en:
  - fetch del pedido
  - sincronizacion del estado editable
  - guardado del cambio de estado
  - composicion del header y las secciones del detalle
- la logica de metricas, facts, links derivados y bloques visuales queda fuera del render principal
- `AdminRepairPricingRuleCreatePage.tsx` y `AdminRepairPricingRuleEditPage.tsx` ya no duplican payloads, filtros y el formulario entero
- el feature de pricing puntual ahora comparte:
  - `admin-repair-pricing-rule-form.helpers.ts`
  - `admin-repair-pricing-rule-form.sections.tsx`
- las paginas principales quedan centradas en:
  - carga de catalogo y de la regla actual cuando aplica
  - sync del estado del formulario
  - guardado del payload
  - navegacion de cierre
- la logica de opciones, transiciones dependientes y armado del payload queda fuera del render principal
- `AdminModelGroupsPage.tsx` ya no concentra filtros, opciones, patch local y los dos bloques operativos del catalogo tecnico en un solo archivo
- el feature de grupos de modelos ahora se reparte entre:
  - `admin-model-groups.helpers.ts`
  - `admin-model-groups.sections.tsx`
- la pagina principal queda centrada en:
  - carga de filtros, marcas, grupos y modelos
  - mutaciones de alta y guardado
  - asignacion de modelos a grupo
- la logica de opciones, patch local y composicion de bloques queda fuera del render principal
- `AdminProductCreatePage.tsx` ya no concentra validacion, payload de alta, resumen previo y bloques visuales del formulario en un solo archivo
- el alta de productos ahora se reparte entre:
  - `admin-product-create.helpers.ts`
  - `admin-product-create.sections.tsx`
- la pagina principal queda centrada en:
  - carga de categorias, proveedores y reglas de pricing
  - sincronizacion de la recomendacion de precio
  - manejo del preview de imagen
  - submit y navegacion de cierre
- la logica de validacion, payload y resumen previo queda fuera del render principal

Desde la ola de simplificacion de 2026-03-30 quedaron formalizados estos limites:

- frontend `repairs` ahora secciona el flujo de proveedor + repuesto + preview en piezas chicas:
  - `RepairProviderPartPricingSection.tsx` como orquestador de estado y requests
  - `repair-provider-part-pricing-section.helpers.ts` para logica pura y tipos compartidos
  - `repair-provider-part-pricing-section.search.tsx` para controles, resultados y resumen de seleccion
  - `repair-provider-part-pricing-section.preview.tsx` para preview/calculo/aplicacion del snapshot draft
  - `repair-provider-part-pricing-section.snapshot.tsx` para snapshot activo e historial
- `AdminRepairDetailPage.tsx` ahora queda como orquestador de carga, validacion y guardado:
  - `admin-repair-detail.helpers.ts` concentra parseo, validaciones y diff del patch
  - `admin-repair-detail.sections.tsx` concentra stats, estado, formulario, sugerencias e historial
- `AdminRepairCreatePage.tsx` ahora queda como orquestador de catalogo, pricing y submit:
  - `admin-repair-create.helpers.ts` concentra normalizacion, validaciones y armado del payload
  - `admin-repair-create.sections.tsx` concentra las sections de datos basicos, diagnostico y cierre
- frontend `orders` ahora secciona el tracking admin entre orquestacion, estado derivado y UI:
  - `AdminOrdersPage.tsx` como orquestador de fetch, seleccion y cambio de estado
  - `admin-orders.helpers.ts` para metricas, filtros y enlaces derivados del subdominio
  - `admin-orders.sections.tsx` para filtros, resumen, listado y detalle inline del pedido
- frontend `orders` ahora tambien secciona la venta rapida admin entre orquestacion, helpers y panels:
  - `AdminQuickSalesPage.tsx` como orquestador de catalogo, carrito y confirmacion
  - `admin-quick-sales.helpers.ts` para validaciones, totales y mutaciones puras del ticket
  - `admin-quick-sales.sections.tsx` para scanner, busqueda manual y ticket actual
- la cascada global del frontend ahora queda repartida por capas fisicas sin cambiar el entrypoint del build:
  - `styles.css` como entrypoint unico importado por `main.tsx`
  - `src/styles/base.css`
  - `src/styles/store.css`
  - `src/styles/layout.css`
  - `src/styles/repairs.css`
  - `src/styles/components.css`
  - `src/styles/admin.css`
  - `src/styles/commerce.css`
- validacion Zod reusable en controllers: `*.schemas.ts`
- helper comun para errores de parseo: `src/common/http/zod-bad-request.ts`
- storage local encapsulado: `src/common/storage/public-asset-storage.service.ts`
- subservicios admin iniciales:
  - `admin-dashboard.service.ts`
  - `admin-settings.service.ts`
  - `admin-brand-assets.service.ts`
  - `admin-communications.service.ts`
  - `admin-warranty-registry.service.ts`
  - `admin-finance.service.ts`
  - `admin-provider-registry.service.ts`
  - `admin-provider-search.service.ts`
  - `admin-provider-search.parsers.ts`
  - `admin-provider-search-ranking.ts`
  - `admin-provider-search.text.ts`
  - `admin-providers.service.ts` como facade publica del subdominio
- `CatalogAdminModule` ahora usa facade + subservicios por responsabilidad:
  - `catalog-admin-categories.service.ts`
  - `catalog-admin-products.service.ts`
  - `catalog-admin-pricing.service.ts`
  - `catalog-admin-support.service.ts`
- en frontend, `catalogAdmin` ya reparte el formulario comercial entre helpers/controls compartidos y paginas orquestadoras
- en frontend, `providers` ya reparte resumen, prioridad, alta y tabla editable entre helpers + sections del feature
- `RepairsModule` ahora usa facade + subservicios por responsabilidad:
  - `repairs-admin.service.ts`
  - `repairs-public.service.ts`
  - `repairs-pricing.service.ts`
  - `repairs-notifications.service.ts`
  - `repairs-support.service.ts`
  - `repairs-timeline.service.ts`
- `OrdersModule` ahora usa facade + subservicios por responsabilidad:
  - `orders-checkout.service.ts`
  - `orders-admin.service.ts`
  - `orders-quick-sales.service.ts`
  - `orders-notifications.service.ts`
  - `orders-support.service.ts`
- harness de tests del monorepo con Vitest por workspace

Esto no cambia rutas ni contratos publicos, pero reduce acople interno y hace mas segura la limpieza futura.

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
- `AppShell.tsx` sigue siendo entrypoint transversal del shell, pero la UI pesada ya se reparte en `layouts/app-shell/*`
- `admin.service.ts` es el servicio mas grande y transversal del backend
- `styles.css` ya no es monolitico, pero la cascada visual global sigue siendo un punto transversal sensible aunque ahora este seccionada en `src/styles/*`
- `catalog-admin.service.ts` y `admin.service.ts` escriben en `apps/web/public`
- scripts de migracion y visual parity todavia dependen del repo root legacy
