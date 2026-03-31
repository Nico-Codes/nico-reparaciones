# FRONTEND_MAP

## Base de la aplicacion frontend

Ubicacion operativa:

- `next-stack/apps/web`

Entrypoint:

- `next-stack/apps/web/src/main.tsx`

Router principal:

- `next-stack/apps/web/src/App.tsx`

Layout principal:

- `next-stack/apps/web/src/layouts/AppShell.tsx`
- `next-stack/apps/web/src/layouts/app-shell/*`

Estilos globales:

- `next-stack/apps/web/src/styles.css`
- `next-stack/apps/web/src/styles/base.css`
- `next-stack/apps/web/src/styles/store.css`
- `next-stack/apps/web/src/styles/layout.css`
- `next-stack/apps/web/src/styles/repairs.css`
- `next-stack/apps/web/src/styles/components.css`
- `next-stack/apps/web/src/styles/admin.css`
- `next-stack/apps/web/src/styles/commerce.css`

## Router y estrategia de navegacion

El router usa `BrowserRouter` y define rutas explicitamente en `App.tsx`.

Caracteristicas confirmadas:

- entrada `/` con redireccion segun rol
- aliases legacy mapeados a rutas nuevas
- rutas publicas
- rutas autenticadas de usuario
- rutas admin protegidas
- redirecciones de compatibilidad para nombres antiguos en espanol e ingles

## Guards

Confirmados:

- `RequireAuth`
- `RequireAdmin`

Responsabilidad:

- bloquear vistas de usuario sin sesion valida
- bloquear vistas admin para usuarios sin rol `ADMIN`

## Providers, contextos y estado global

No se detecto una capa custom de React Context global para dominio de negocio.

Lo confirmado es:

- `BrowserRouter` como provider de routing
- estado local por feature con `useState` y `useEffect`
- persistencia de auth en `localStorage`
- persistencia de carrito en `localStorage`
- sincronizacion por eventos de ventana:
  - `nico:auth-changed`
  - eventos de carrito definidos en `features/cart/storage.ts`

Esto implica que la app no usa hoy Redux, Zustand ni un Context de dominio global confirmado.

## Layouts y comportamiento transversal

### AppShell

Hoy orquesta:

- navbar desktop y mobile
- estado de sidebar y menu de cuenta
- sync de auth y branding visible
- accesos de usuario y admin
- popup de carrito agregado
- wiring de `layouts/app-shell/mobile-sidebar.tsx`
- wiring de `layouts/app-shell/account-menu.tsx`
- wiring de `layouts/app-shell/footer.tsx`

### BrandingHeadSync

Sincroniza branding dinamico y metadatos del sitio.

### GlobalVisualEnhancements

Aplica mejoras visuales globales.

## Rutas publicas principales

- `/store`
- `/store/:slug`
- `/cart`
- `/help`
- `/reparacion`
- `/reparacion/:id/presupuesto`

Rutas legacy alias relevantes:

- `/tienda`
- `/producto/:slug`
- `/carrito`
- `/ayuda`

## Rutas auth

- `/auth/login`
- `/auth/register`
- `/auth/verify-email`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/bootstrap-admin`

Nota importante:

- no existen rutas `/auth/google` ni `/auth/google/callback` en el router nuevo.
- el auth social no forma parte del stack nuevo.

## Rutas de usuario autenticado

- `/checkout`
- `/orders`
- `/orders/:id`
- `/repairs`
- `/repairs/:id`
- `/mi-cuenta`

## Rutas admin

Principales grupos detectados:

- dashboard y alertas
- pedidos
- ventas rapidas
- reparaciones
- productos y categorias
- usuarios
- configuraciones
- seguridad 2FA
- pricing
- catalogo tecnico
- proveedores
- garantias
- contabilidad
- mail templates
- WhatsApp templates/logs
- ayuda editable

## Paginas principales por feature

Auth:

- `LoginPage.tsx`
- `RegisterPage.tsx`
- `ForgotPasswordPage.tsx`
- `ResetPasswordPage.tsx`
- `VerifyEmailPage.tsx`
- `MyAccountPage.tsx`
- `BootstrapAdminPage.tsx`

Store y carrito:

- `StorePage.tsx`
- `store-page.helpers.ts`
- `store-page.sections.tsx`
- `StoreProductDetailPage.tsx`
- `CartPage.tsx`
- `CartAddedPopup.tsx`
- `CheckoutPage.tsx`

Pedidos:

- `MyOrdersPage.tsx`
- `OrderDetailPage.tsx`
- `AdminOrdersPage.tsx`
- `admin-orders.helpers.ts`
- `admin-orders.sections.tsx`
- `AdminOrderDetailPage.tsx`
- `AdminOrderPrintPage.tsx`
- `AdminOrderTicketPage.tsx`
- `AdminQuickSalesPage.tsx`
- `admin-quick-sales.helpers.ts`
- `admin-quick-sales.sections.tsx`
- `AdminQuickSalesHistoryPage.tsx`

Reparaciones:

- `PublicRepairLookupPage.tsx`
- `PublicRepairQuoteApprovalPage.tsx`
- `MyRepairsPage.tsx`
- `RepairDetailPage.tsx`
- `AdminRepairsListPage.tsx`
- `AdminRepairDetailPage.tsx`
- `AdminRepairPrintPage.tsx`
- `AdminRepairTicketPage.tsx`

Admin general:

- `AdminDashboardPage.tsx`
- `admin-dashboard.helpers.ts`
- `admin-dashboard.sections.tsx`
- `AdminAlertsPage.tsx`
- `AdminUsersPage.tsx`
- `AdminSettingsHubPage.tsx`
- `AdminSmtpSettingsPage.tsx`
- `AdminAutoReportsPage.tsx`
- `admin-auto-reports.helpers.ts`
- `admin-auto-reports.sections.tsx`
- `AdminBusinessSettingsPage.tsx`
- `AdminVisualIdentityPage.tsx`
- `AdminStoreHeroSettingsPage.tsx`
- `admin-store-hero-settings.helpers.ts`
- `admin-store-hero-settings.sections.tsx`
- `Admin2faSecurityPage.tsx`
- `AdminMailTemplatesPage.tsx`
- `AdminWhatsappPage.tsx`
- `AdminWhatsappOrdersPage.tsx`
- `AdminHelpFaqPage.tsx`
- `AdminAccountingPage.tsx`

Catalogo comercial:

- `AdminProductsPage.tsx`
- `admin-products.helpers.ts`
- `admin-products.sections.tsx`
- `AdminProductCreatePage.tsx`
- `AdminProductEditPage.tsx`
- `AdminProductLabelPage.tsx`
- `AdminCategoriesPage.tsx`
- `admin-categories.helpers.ts`
- `admin-categories.sections.tsx`
- `admin-product-form.helpers.ts`
- `admin-product-form.controls.tsx`
- `admin-product-edit.sections.tsx`

Catalogo tecnico y pricing:

- `AdminCalculationsHubPage.tsx`
- `AdminProductPricingRulesPage.tsx`
- `admin-product-pricing-rules.helpers.ts`
- `admin-product-pricing-rules.sections.tsx`
- `AdminRepairPricingRulesPage.tsx`
- `admin-repair-pricing-rules.helpers.ts`
- `admin-repair-pricing-rules.sections.tsx`
- `AdminRepairPricingRuleCreatePage.tsx`

## Seccionado interno reforzado

En la ola de simplificacion del 2026-03-30 quedaron confirmados estos limites internos:

- `RepairProviderPartPricingSection.tsx` ya no concentra toda la UI de proveedor + repuesto + snapshot en un solo archivo
- la seccion se reparte entre:
  - `repair-provider-part-pricing-section.helpers.ts`
  - `repair-provider-part-pricing-section.search.tsx`
  - `repair-provider-part-pricing-section.preview.tsx`
  - `repair-provider-part-pricing-section.snapshot.tsx`
- el archivo principal de la feature queda como orquestador de estado, requests y sincronizacion del snapshot draft
- create/detail siguen compartiendo la misma pieza, pero con una frontera mas clara entre:
  - busqueda de repuestos
  - preview de pricing
  - snapshot activo e historial
- `AdminRepairDetailPage.tsx` ahora delega la UI en:
  - `admin-repair-detail.helpers.ts`
  - `admin-repair-detail.sections.tsx`
- el archivo principal de detalle queda centrado en:
  - carga del caso
  - sincronizacion del formulario
  - validacion
  - recalculo de sugerencia
  - guardado del patch
- `AdminRepairCreatePage.tsx` ahora delega la UI en:
  - `admin-repair-create.helpers.ts`
  - `admin-repair-create.sections.tsx`
- el archivo principal de alta queda centrado en:
  - carga del catalogo tecnico
  - sincronizacion de defaults de marca/modelo/falla
  - recalculo de sugerencia
  - armado del payload
  - submit y navegacion al detalle creado
- `AdminOrdersPage.tsx` ahora delega la UI y el estado derivado en:
  - `admin-orders.helpers.ts`
  - `admin-orders.sections.tsx`
- el archivo principal de pedidos admin queda centrado en:
  - fetch del listado y del detalle seleccionado
  - sincronizacion del pedido abierto
  - cambio de estado
  - composicion de metricas, filtros y tracking
- `AdminQuickSalesPage.tsx` ahora delega la UI y las validaciones del ticket en:
  - `admin-quick-sales.helpers.ts`
  - `admin-quick-sales.sections.tsx`
- el archivo principal de venta rapida queda centrado en:
  - carga del catalogo activo
  - escaneo/carga por codigo
  - confirmacion de la venta
  - navegacion hacia pedido, ticket o impresion
- `AdminProductPricingRulesPage.tsx` ahora delega mapping, filtros y payloads en:
  - `admin-product-pricing-rules.helpers.ts`
  - `admin-product-pricing-rules.sections.tsx`
- el archivo principal de pricing comercial queda centrado en:
  - carga de preferencias, categorias y productos
  - sincronizacion del simulador
  - alta de reglas
  - edicion inline y borrado
- `AdminRepairPricingRulesPage.tsx` ahora delega scope editable, filtros dependientes y payloads en:
  - `admin-repair-pricing-rules.helpers.ts`
  - `admin-repair-pricing-rules.sections.tsx`
- el archivo principal de pricing de reparaciones queda centrado en:
  - carga de reglas y catalogo tecnico
  - sincronizacion de lookups por tipo/grupo
  - patches de scope y estado
  - guardado y borrado
- `AdminDashboardPage.tsx` ahora delega summary, work queue y metadata operativa en:
  - `admin-dashboard.helpers.ts`
  - `admin-dashboard.sections.tsx`
- el archivo principal del dashboard queda centrado en:
  - fetch del panel
  - manejo de loading/error
  - composicion del summary y work queue
  - ensamblado de secciones
- `StorePage.tsx` ahora delega derivaciones puras y UI del catalogo en:
  - `store-page.helpers.ts`
  - `store-page.sections.tsx`
- el archivo principal de tienda queda centrado en:
  - fetch de hero, categorias y productos
  - sincronizacion de query params
  - estado del sheet mobile
  - ensamblado del toolbar, resultados y empty state
- `AdminCategoriesPage.tsx` ahora delega derivaciones y UI del CRUD en:
  - `admin-categories.helpers.ts`
  - `admin-categories.sections.tsx`
- el archivo principal de categorias queda centrado en:
  - fetch del listado
  - sync de ruta create/edit
  - mutaciones de alta, edicion, toggle y borrado
  - composicion del listado, alertas y formulario
- `AdminProductsPage.tsx` ahora delega derivaciones y UI del catalogo operativo en:
  - `admin-products.helpers.ts`
  - `admin-products.sections.tsx`
- el archivo principal de productos queda centrado en:
  - fetch de categorias y productos
  - sync de filtros server/client
  - patches rapidos de stock, estado y destacado
  - composicion del toolbar, stats y listado operativo
- `AdminStoreHeroSettingsPage.tsx` ahora delega metadata de assets, conversiones RGB/HEX y UI visual en:
  - `admin-store-hero-settings.helpers.ts`
  - `admin-store-hero-settings.sections.tsx`
- el archivo principal de portada de tienda queda centrado en:
  - fetch de settings
  - sincronizacion del formulario
  - save del payload
  - upload/reset de assets
  - composicion de alertas, cards y formulario
- `AdminAutoReportsPage.tsx` ahora delega constantes, payloads y resumenes derivados en:
  - `admin-auto-reports.helpers.ts`
  - `admin-auto-reports.sections.tsx`
- el archivo principal de reportes automaticos queda centrado en:
  - fetch de settings
  - sincronizacion del formulario
  - guardado de configuracion
  - envios manuales
  - limpieza e hidratacion del historial operativo
- `AdminRepairPricingRuleEditPage.tsx`
- `AdminModelGroupsPage.tsx`
- `AdminRepairTypesPage.tsx`
- `AdminDeviceTypesPage.tsx`
- `AdminDevicesCatalogPage.tsx`
- `features/deviceCatalog/AdminDeviceCatalogPage.tsx`

Operaciones:

- `features/providers/AdminProvidersPage.tsx`
- `features/providers/admin-providers.helpers.ts`
- `features/providers/admin-providers.sections.tsx`
- `features/warranties/AdminWarrantiesPage.tsx`
- `features/warranties/AdminWarrantyCreatePage.tsx`

## Servicios, API clients y hooks importantes

Clientes API por feature:

- `features/auth/api.ts`
- `features/auth/http.ts`
- `features/cart/api.ts`
- `features/catalogAdmin/api.ts`
- `features/catalogAdmin/productPricingApi.ts`
- `features/admin/api.ts` tambien actua como cliente de `providers`, `warranties` y `accounting`
- `features/catalogAdmin/admin-product-form.helpers.ts`
- `features/catalogAdmin/admin-product-form.controls.tsx`
- `features/deviceCatalog/api.ts`
- `features/help/api.ts`
- `features/orders/api.ts`
- `features/repairs/api.ts`
- `features/store/api.ts`
- `features/admin/api.ts`
- `features/admin/settingsApi.ts`
- `features/admin/usersApi.ts`
- `features/admin/mailTemplatesApi.ts`
- `features/admin/whatsappApi.ts`
- `features/admin/helpFaqApi.ts`
- `features/admin/brandAssetsApi.ts`
- `features/admin/adminSecurityApi.ts`

Hooks y almacenamiento relevantes:

- `features/cart/useCart.ts`
- `features/cart/storage.ts`
- `features/auth/storage.ts`

## Branding dinamico y comportamiento visual clave

Confirmado por codigo:

- `BrandingHeadSync.tsx` sincroniza branding del sitio
- `AppShell.tsx` usa datos de branding visibles en header y deriva header/footer hacia `layouts/app-shell/*`
- `CartAddedPopup.tsx` replica comportamiento legacy de agregado al carrito
- `CustomSelect` y `ActionDropdown` concentran la base visual de selects y menus custom
- `styles.css` ahora funciona como entrypoint del lenguaje visual y reparte la cascada en `src/styles/*`

## Hallazgos relevantes para mantenimiento

- `App.tsx` es grande y concentra routing, aliases legacy y redirecciones
- `AppShell.tsx` bajo bastante y hoy delega la UI transversal pesada a `layouts/app-shell/*`
- `AdminProductEditPage.tsx` ya no concentra todo el formulario: hoy orquesta estado, carga y submit mientras la UI vive en `admin-product-edit.sections.tsx`
- `AdminProvidersPage.tsx` ya no concentra toda la UI operativa: hoy orquesta fetch, acciones y patches mientras la vista vive en `admin-providers.sections.tsx`
- `styles.css` ya no es un archivo monolitico: hoy solo importa capas fisicas (`base`, `store`, `layout`, `repairs`, `components`, `admin`, `commerce`) manteniendo el mismo wiring del build
- el frontend usa mas estado local que estado global compartido
- en Fase 3 se retiraron tres remanentes sin referencias estaticas confirmadas:
  - `features/admin/AdminSettingsPage.tsx`
  - `features/repairs/AdminRepairsPage.tsx`
  - `features/auth/AuthStatusCard.tsx`
  La eliminacion se hizo despues de `rg` sin imports operativos y typecheck en verde.


## Validacion Fase 4A (2026-03-06)

### Rutas criticas confirmadas por codigo
- Publicas: `/`, `/store`, `/store/:slug`, `/cart`, `/reparacion`, `/reparacion/:id/presupuesto`, `/help`
- Auth: `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `/auth/bootstrap-admin`
- Usuario autenticado: `/checkout`, `/orders`, `/orders/:id`, `/repairs`, `/repairs/:id`, `/mi-cuenta`
- Admin: `/admin`, `/admin/orders`, `/admin/repairs`, `/admin/productos`, `/admin/configuraciones`, `/admin/precios`, `/admin/whatsapp`, `/admin/whatsapppedidos`, `/admin/seguridad/2fa` y subrutas asociadas

### Guards confirmados
- `RequireAuth` protege checkout, pedidos, reparaciones y cuenta.
- `RequireAdmin` protege dashboard y modulo admin completo.
- `RootEntryRedirect` envia a `/admin` o `/store` segun la sesion local existente.

### Hallazgo residual confirmado
- el router nuevo ya no expone `/auth/google*`.
- el auth social fue retirado como alcance del proyecto en Fase 4D.

### Evidencia funcional
- `npm run smoke:web` OK
- `npm run qa:route-parity` OK
- No se detectaron imports rotos ni navegacion a paths inexistentes en el router auditado.
