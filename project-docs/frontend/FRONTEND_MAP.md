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
- composicion visual del header, footer y sidebar mobile
- accesos de usuario y admin
- popup de carrito agregado
- wiring de `layouts/app-shell/mobile-sidebar.tsx`
- wiring de `layouts/app-shell/account-menu.tsx`
- wiring de `layouts/app-shell/footer.tsx`
- delega sync de auth, branding visible, media-query, foco accesible y armado de links a `layouts/app-shell/use-app-shell.ts`

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
- `/auth/apple/callback`
- `/auth/google/callback`
- `/auth/register`
- `/auth/verify-email`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/bootstrap-admin`

Nota importante:

- el router nuevo expone `/auth/google/callback` y `/auth/apple/callback` como fronteras publicas para completar redirects de auth social.
- el boton social vive solo en `LoginPage.tsx`; `register` sigue sin CTA social propio.
- `LoginPage.tsx` ya no decide por hardcode si muestra Google o Apple: consulta `/api/auth/social/providers` y renderiza solo los providers habilitados de verdad por el backend.

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
- hub de calculo de reparaciones en `/admin/calculos/reparaciones`
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
- `AppleAuthCallbackPage.tsx`
- `GoogleAuthCallbackPage.tsx`
- `RegisterPage.tsx`
- `ForgotPasswordPage.tsx`
- `ResetPasswordPage.tsx`
- `VerifyEmailPage.tsx`
- `MyAccountPage.tsx`
- `google-auth.helpers.ts`
- `my-account.helpers.ts`
- `my-account.sections.tsx`
- `BootstrapAdminPage.tsx`

Store y carrito:

- `StorePage.tsx`
- `store-page.helpers.ts`
- `store-page.sections.tsx`
- `StoreProductDetailPage.tsx`
- `store-product-detail.helpers.ts`
- `store-product-detail.sections.tsx`
- `CartPage.tsx`
- `cart.helpers.ts`
- `cart.sections.tsx`
- `CartAddedPopup.tsx`
- `CheckoutPage.tsx`
- `checkout.helpers.ts`
- `checkout.sections.tsx`

Pedidos:

- `MyOrdersPage.tsx`
- `OrderDetailPage.tsx`
- `order-detail.helpers.ts`
- `order-detail.sections.tsx`
- `AdminOrdersPage.tsx`
- `admin-orders.helpers.ts`
- `admin-orders.sections.tsx`
- `AdminOrderDetailPage.tsx`
- `admin-order-detail.helpers.ts`
- `admin-order-detail.sections.tsx`
- `AdminOrderPrintPage.tsx`
- `AdminOrderTicketPage.tsx`
- `AdminQuickSalesPage.tsx`
- `admin-quick-sales.helpers.ts`
- `admin-quick-sales.sections.tsx`
- `AdminQuickSalesHistoryPage.tsx`

Reparaciones:

- `AdminRepairCalculationsHubPage.tsx`
- `admin-repair-calculation-context.ts`
- `admin-repair-calculation-context.test.ts`
- `admin-repair-calculations-hub.sections.tsx`
- `PublicRepairLookupPage.tsx`
- `public-repair-lookup.helpers.ts`
- `public-repair-lookup.sections.tsx`
- `PublicRepairQuoteApprovalPage.tsx`
- `public-repair-quote-approval.helpers.ts`
- `public-repair-quote-approval.sections.tsx`
- `MyRepairsPage.tsx`
- `RepairDetailPage.tsx`
- `repair-detail.helpers.ts`
- `repair-detail.sections.tsx`
- `AdminRepairsListPage.tsx`
- `admin-repairs-list.helpers.ts`
- `admin-repairs-list.sections.tsx`
- `AdminRepairDetailPage.tsx`
- `AdminRepairPrintPage.tsx`
- `AdminRepairTicketPage.tsx`

Notas operativas del subdominio:

- la entrada recomendada para catalogo tecnico + pricing de reparaciones ahora es `/admin/calculos/reparaciones`
- la UI explica y mantiene este orden:
  - `Tipo -> Marca -> Grupo -> Modelo`
  - `Falla por Tipo`
- el alta de modelos ya no depende de una marca implicita: catalogo y hub muestran una `marca activa` visible y seleccionable desde la propia lista de marcas
- las vistas historicas (`/admin/catalogodispositivos`, `/admin/gruposmodelos`, `/admin/tiposreparacion`, `/admin/precios`) siguen existiendo como editores especificos con contexto por query string

Admin general:

- `AdminDashboardPage.tsx`
- `admin-dashboard.helpers.ts`
- `admin-dashboard.sections.tsx`
- `AdminAlertsPage.tsx`
- `admin-alerts.helpers.ts`
- `admin-alerts.sections.tsx`
- `AdminUsersPage.tsx`
- `admin-users.helpers.ts`
- `admin-users.sections.tsx`
- `AdminSettingsHubPage.tsx`
- `admin-settings-hub.helpers.ts`
- `admin-settings-hub.sections.tsx`
- `AdminSmtpSettingsPage.tsx`
- `AdminAutoReportsPage.tsx`
- `admin-auto-reports.helpers.ts`
- `admin-auto-reports.sections.tsx`
- `AdminBusinessSettingsPage.tsx`
- `admin-business-settings.helpers.ts`
- `admin-business-settings.sections.tsx`
- `AdminVisualIdentityPage.tsx`
- `admin-visual-identity.helpers.ts`
- `admin-visual-identity.sections.tsx`
- `AdminStoreHeroSettingsPage.tsx`
- `admin-store-hero-settings.helpers.ts`
- `admin-store-hero-settings.sections.tsx`
- `Admin2faSecurityPage.tsx`
- `admin-2fa-security.helpers.ts`
- `admin-2fa-security.sections.tsx`
- `AdminMailTemplatesPage.tsx`
- `AdminWhatsappPage.tsx`
- `admin-whatsapp.helpers.ts`
- `admin-whatsapp.sections.tsx`
- `AdminWhatsappOrdersPage.tsx`
- `admin-whatsapp-orders.helpers.ts`
- `admin-whatsapp-orders.sections.tsx`
- `AdminHelpFaqPage.tsx`
- `admin-help-faq.helpers.ts`
- `admin-help-faq.sections.tsx`
- `AdminAccountingPage.tsx`
- `admin-accounting.helpers.ts`
- `admin-accounting.sections.tsx`

Catalogo comercial:

- `AdminProductsPage.tsx`
- `admin-products.helpers.ts`
- `admin-products.sections.tsx`
- `AdminProductCreatePage.tsx`
- `AdminProductEditPage.tsx`
- `admin-product-create.helpers.ts`
- `admin-product-create.sections.tsx`
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
- `AdminRepairPricingRuleEditPage.tsx`
- `admin-repair-pricing-rule-form.helpers.ts`
- `admin-repair-pricing-rule-form.sections.tsx`
- `AdminDevicesCatalogPage.tsx`
- `admin-devices-catalog.helpers.ts`
- `admin-devices-catalog.sections.tsx`
- `AdminModelGroupsPage.tsx`
- `admin-model-groups.helpers.ts`
- `admin-model-groups.sections.tsx`

## Seccionado interno reforzado

En la ola de simplificacion del 2026-03-30 quedaron confirmados estos limites internos:

- `RepairProviderPartPricingSection.tsx` ya no concentra toda la UI ni toda la orquestacion de proveedor + repuesto + snapshot en un solo archivo
- la seccion se reparte entre:
  - `use-repair-provider-part-pricing.ts`
  - `use-repair-provider-part-search.ts`
  - `repair-provider-part-pricing-section.helpers.ts`
  - `repair-provider-part-pricing-section.search.tsx`
  - `repair-provider-part-pricing-section.preview.tsx`
  - `repair-provider-part-pricing-section.snapshot.tsx`
- el componente principal ahora queda como shell de composicion y delega el estado async a hooks mas chicos
- `use-repair-provider-part-pricing.ts` queda enfocado en preview, snapshot draft y aplicacion del sugerido
- `use-repair-provider-part-search.ts` concentra carga de proveedores, busqueda agregada, seleccion e hidratacion desde snapshots activos
- create/detail siguen compartiendo la misma pieza, pero con una frontera mas clara entre:
  - busqueda de repuestos
  - preview de pricing
  - snapshot activo e historial
- `AdminRepairDetailPage.tsx` ahora delega la UI en:
  - `admin-repair-detail.helpers.ts`
  - `admin-repair-detail.sections.tsx`
- `admin-repair-detail.sections.tsx` ahora delega bloques visuales densos en:
  - `admin-repair-detail-status-panels.tsx`
  - `admin-repair-detail-pricing-panels.tsx`
  - `admin-repair-detail-sidebar.tsx`
- `AdminRepairDetailPage.tsx` ahora tambien delega la orquestacion pesada en:
  - `use-admin-repair-detail.ts`
- el archivo principal de detalle queda centrado en:
  - composicion del header y alerts
  - composicion de sections y sidebar
  - wiring final del flujo de pricing y snapshot
  - guardado del patch
- `AdminRepairCreatePage.tsx` ahora delega la UI en:
  - `admin-repair-create.helpers.ts`
  - `admin-repair-create.sections.tsx`
- `admin-repair-create.sections.tsx` ahora delega bloques visuales densos en:
  - `admin-repair-create-basic-panel.tsx`
  - `admin-repair-create-diagnosis-panel.tsx`
  - `admin-repair-create-submit-panel.tsx`
- `AdminRepairCreatePage.tsx` ahora tambien delega la orquestacion pesada en:
  - `use-admin-repair-create.ts`
- el archivo principal de alta queda centrado en:
  - composicion del header y alerts
  - composicion de sections y notas
  - wiring final del flujo de provider part pricing
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
- `AdminProductCreatePage.tsx` ahora delega validacion, payloads y bloques visuales en:
  - `admin-product-create.helpers.ts`
  - `admin-product-create.sections.tsx`
- el archivo principal de alta de producto queda centrado en:
  - carga de categorias, proveedores y reglas de pricing
  - sincronizacion de la recomendacion de precio
  - manejo del preview de imagen
  - submit y navegacion de cierre
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
- `AdminVisualIdentityPage.tsx` ahora delega metadata de assets, resolucion de paths y previews visuales en:
  - `admin-visual-identity.helpers.ts`
  - `admin-visual-identity.sections.tsx`
- el archivo principal de identidad visual queda centrado en:
  - fetch de settings
  - upload/reset de assets
  - sync del archivo seleccionado por slot
  - composicion de alertas y secciones
- `AdminBusinessSettingsPage.tsx` ahora delega defaults, payloads y estado dirty en:
  - `admin-business-settings.helpers.ts`
  - `admin-business-settings.sections.tsx`
- el archivo principal de datos del negocio queda centrado en:
  - fetch de settings
  - sincronizacion del formulario base
  - guardado del payload
  - cancelacion de cambios
  - composicion del feedback, sidebar y acciones
- `AdminWarrantyCreatePage.tsx` ahora delega defaults, payloads y opciones derivadas en:
  - `admin-warranty-create.helpers.ts`
  - `admin-warranty-create.sections.tsx`
- el archivo principal de alta de garantia queda centrado en:
  - fetch de reparaciones, proveedores y productos
  - sync del formulario y de la reparacion seleccionada
  - armado del payload de garantia
  - submit y navegacion de cierre
- `AdminWarrantiesPage.tsx` ahora delega filtros, stats y bloques visuales del listado en:
  - `admin-warranties.helpers.ts`
  - `admin-warranties.sections.tsx`
- el archivo principal de garantias queda centrado en:
  - fetch del listado y resumen
  - refresh manual de filtros
  - cierre de incidentes
  - composicion del hero, stats, filtros y tabla
- `AdminWhatsappPage.tsx` ahora delega defaults, hydrate/save de templates y bloques visuales en:
  - `admin-whatsapp.helpers.ts`
  - `admin-whatsapp.sections.tsx`
- el archivo principal de WhatsApp queda centrado en:
  - fetch de templates y logs
  - persistencia de plantillas
  - refresh manual del historial
  - composicion de variables, editor, acciones y logs
- `AdminWhatsappOrdersPage.tsx` ahora delega defaults, hydrate/save de templates y bloques visuales en:
  - `admin-whatsapp-orders.helpers.ts`
  - `admin-whatsapp-orders.sections.tsx`
- el archivo principal de WhatsApp para pedidos queda centrado en:
  - fetch de templates y logs del canal `orders`
  - persistencia de plantillas por estado
  - refresh manual del historial
  - composicion de variables, editor, acciones y logs
- `AdminAccountingPage.tsx` ahora delega filtros, opciones y bloques visuales del libro contable en:
  - `admin-accounting.helpers.ts`
  - `admin-accounting.sections.tsx`
- el archivo principal de contabilidad queda centrado en:
  - fetch del libro unificado
  - sincronizacion de filtros por texto, direccion, categoria y rango
  - composicion del hero, resumen, categorias y tabla operativa
- `CheckoutPage.tsx` ahora delega derivaciones, validaciones y bloques visuales del checkout en:
  - `checkout.helpers.ts`
  - `checkout.sections.tsx`
- el archivo principal de checkout queda centrado en:
  - fetch y normalizacion del quote del carrito
  - confirmacion del pedido
  - limpieza del carrito y navegacion de cierre
  - composicion de pago, cuenta, acciones y resumen
- `MyAccountPage.tsx` ahora delega validaciones, normalizacion y bloques visuales de perfil/seguridad en:
  - `my-account.helpers.ts`
  - `my-account.sections.tsx`
- el archivo principal de cuenta queda centrado en:
  - fetch del perfil autenticado
  - guardado del perfil y sincronizacion de `authStorage`
  - cambio de contrasena
  - composicion del header y las dos secciones operativas
- `CartPage.tsx` ahora delega normalizacion del quote, stock y bloques visuales del carrito en:
  - `cart.helpers.ts`
  - `cart.sections.tsx`
- el archivo principal de carrito queda centrado en:
  - fetch del quote del carrito
  - normalizacion de items validos
  - navegacion al checkout
  - composicion del header, listado y resumen
- `StoreProductDetailPage.tsx` ahora delega formato, stock y bloques visuales del detalle publico en:
  - `store-product-detail.helpers.ts`
  - `store-product-detail.sections.tsx`
- el archivo principal del detalle queda centrado en:
  - fetch del producto por slug
  - sincronizacion de la cantidad segun stock
  - alta al carrito
  - composicion del breadcrumb, media, compra y metadatos
- `AdminRepairsListPage.tsx` ahora delega filtros, stats y bloques visuales del listado tecnico en:
  - `admin-repairs-list.helpers.ts`
  - `admin-repairs-list.sections.tsx`
- el archivo principal del listado queda centrado en:
  - fetch del listado admin
  - sincronizacion de query y filtro de estado
  - composicion del header, metricas y mesa operativa
- `AdminDevicesCatalogPage.tsx` ahora delega slugify, filtros y opciones derivadas en:
  - `admin-devices-catalog.helpers.ts`
  - `admin-devices-catalog.sections.tsx`
- el archivo principal de catalogo tecnico queda centrado en:
  - fetch de tipos, marcas, modelos y fallas
  - sync de filtros por tipo y marca
  - mutaciones de alta, rename y toggle
  - composicion de los tres bloques operativos
- `AdminOrderDetailPage.tsx` ahora delega metricas, facts y bloques del detalle en:
  - `admin-order-detail.helpers.ts`
  - `admin-order-detail.sections.tsx`
- el archivo principal de detalle queda centrado en:
  - fetch del pedido
  - sincronizacion del estado editable
  - guardado del cambio de estado
  - composicion del header y las secciones del detalle
- `AdminRepairPricingRuleCreatePage.tsx` y `AdminRepairPricingRuleEditPage.tsx` ahora comparten la base del formulario en:
  - `admin-repair-pricing-rule-form.helpers.ts`
  - `admin-repair-pricing-rule-form.sections.tsx`
- las paginas principales de pricing puntual quedan centradas en:
  - carga del catalogo y de la regla actual cuando aplica
  - sync del estado del formulario
  - guardado del payload
  - navegacion de cierre
- `AdminModelGroupsPage.tsx` ahora delega opciones, patch local y bloques visuales en:
  - `admin-model-groups.helpers.ts`
  - `admin-model-groups.sections.tsx`
- el archivo principal de grupos queda centrado en:
  - carga de filtros, marcas, grupos y modelos
  - mutaciones de alta y guardado
  - asignacion de modelos a grupo
- `AdminRepairPricingRuleEditPage.tsx`
- `AdminModelGroupsPage.tsx`
- `AdminRepairTypesPage.tsx`
- `admin-repair-types.helpers.ts`
- `admin-repair-types.sections.tsx`
- `AdminDeviceTypesPage.tsx`
- `admin-device-types.helpers.ts`
- `admin-device-types.sections.tsx`
- `AdminDevicesCatalogPage.tsx`
- `features/deviceCatalog/AdminDeviceCatalogPage.tsx`

Operaciones:

- `features/providers/AdminProvidersPage.tsx`
- `features/providers/admin-providers.helpers.ts`
- `features/providers/admin-providers.sections.tsx`
- `features/warranties/AdminWarrantiesPage.tsx`
- `features/warranties/AdminWarrantyCreatePage.tsx`
- `features/warranties/admin-warranties.helpers.ts`
- `features/warranties/admin-warranties.sections.tsx`
- `features/warranties/admin-warranty-create.helpers.ts`
- `features/warranties/admin-warranty-create.sections.tsx`

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
- `Admin2faSecurityPage.tsx` ya no concentra validaciones, QR, feedback y bloques de activacion/desactivacion en un solo archivo
- el feature admin de seguridad 2FA ahora se reparte entre:
  - `admin-2fa-security.helpers.ts`
  - `admin-2fa-security.sections.tsx`
- la pagina principal queda centrada en:
  - fetch del estado 2FA
  - generacion, activacion y desactivacion del segundo factor
  - composicion del feedback y de los bloques visuales
- la logica de QR, normalizacion del codigo y mensajes derivados queda fuera del render principal
- cierre de seccionado pendiente:
  - `AdminUsersPage.tsx` ahora delega stats, filtros y listado en `admin-users.helpers.ts` y `admin-users.sections.tsx`
  - `AdminSettingsHubPage.tsx` ahora delega datasets y cards en `admin-settings-hub.helpers.ts` y `admin-settings-hub.sections.tsx`
  - `AdminAlertsPage.tsx` ahora delega targets, severidad, metricas y listado en `admin-alerts.helpers.ts` y `admin-alerts.sections.tsx`
  - `AdminHelpFaqPage.tsx` ahora delega sort, payloads y editor en `admin-help-faq.helpers.ts` y `admin-help-faq.sections.tsx`
  - `AdminRepairTypesPage.tsx` y `AdminDeviceTypesPage.tsx` ahora delegan slugify/payloads y grillas en helpers + sections propios
  - `RepairDetailPage.tsx`, `OrderDetailPage.tsx`, `PublicRepairLookupPage.tsx` y `PublicRepairQuoteApprovalPage.tsx` ahora delegan derivaciones y bloques visuales en helpers + sections por feature
- con esta ola, el seccionado pendiente del frontend queda cerrado en las pantallas que todavia mezclaban fetch, validaciones y render completo en un solo `Page.tsx`
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

## Segunda ola de refinamiento cerrada

En la ola de refinamiento final del 2026-04-13 se cerraron los hotspots internos que seguian densos despues del seccionado principal:

- `admin-orders.sections.tsx` ahora solo expone la frontera publica y delega en:
  - `admin-orders-counters.tsx`
  - `admin-orders-detail-panel.tsx`
  - `admin-orders-row.tsx`
- `repair-provider-part-pricing-section.search.tsx` ahora solo compone y delega en:
  - `repair-provider-part-search-controls.tsx`
  - `repair-provider-part-search-results.tsx`
  - `repair-provider-part-selected-summary.tsx`
- `use-admin-repair-create.ts` ya no concentra catalogo + pricing sugerido; ahora delega en:
  - `use-admin-repair-create-catalog.ts`
  - `use-admin-repair-create-pricing.ts`
- `admin-product-pricing-rules.sections.tsx` ahora queda como frontera y reparte la UI en:
  - `admin-product-pricing-rules.fields.tsx`
  - `admin-product-pricing-rules-panels.tsx`
- `admin-providers.sections.tsx` ahora queda como frontera y delega en:
  - `admin-providers-panels.tsx`
- `admin-dashboard.sections.tsx` ahora queda como frontera y delega en:
  - `admin-dashboard-panels.tsx`
- `admin-products.sections.tsx` ahora queda como frontera y delega en:
  - `admin-products-panels.tsx`
- `admin-quick-sales.sections.tsx` ahora queda como frontera y delega en:
  - `admin-quick-sales-search.tsx`
  - `admin-quick-sales-ticket.tsx`
- `admin-product-edit.sections.tsx` ahora queda como frontera y delega la UI mayor en:
  - `admin-product-edit-panels.tsx`
- `admin-repair-pricing-rules.sections.tsx` ahora queda como frontera y delega en:
  - `admin-repair-pricing-rules.controls.tsx`
  - `admin-repair-pricing-rules-row.tsx`
- `admin-store-hero-settings.sections.tsx` ahora queda como frontera y delega en:
  - `admin-store-hero-settings.assets.tsx`
  - `admin-store-hero-settings.form.tsx`

Con este cierre, lo que queda grande en frontend ya no son paginas o `sections.tsx` monoliticos pendientes, sino paneles finales u orquestadores deliberados del dominio.
- el router nuevo vuelve a exponer `/auth/google/callback` y `/auth/apple/callback` para cerrar redirects sociales.
- el auth social queda acotado a `LoginPage.tsx` y solo para cuentas `USER`.

## Repairs: busqueda de repuestos

- `RepairProviderPartPricingSection` mantiene tres piezas claras:
  - `repair-provider-part-search-controls.tsx`
  - `repair-provider-part-search-results.tsx`
  - `repair-provider-part-selected-summary.tsx`
- La UI de resultados ya no muestra auditoria visible por proveedor. El foco vuelve a ser:
  - loading
  - error global
  - empty state
  - lista de repuestos utiles
- `use-repair-provider-part-search.ts` ahora hidrata el selector de proveedores solo con `active && searchEnabled && searchInRepairs && endpoint`.
- `repair-provider-part-pricing-section.helpers.ts` sigue filtrando `smoke suppliers` del rendering visible por seguridad, pero la experiencia publica del flujo ya no expone cards tecnicas de proveedor.

## Admin: proveedores

- `AdminProvidersPage.tsx` expone ahora un toggle explicito `Incluir en busqueda de reparaciones`.
- Ese toggle existe tanto al crear como al editar un proveedor.
- La intencion operativa es separar:
  - `Busqueda habilitada`: el proveedor soporta scraping/probe
  - `Incluir en busqueda de reparaciones`: entra o no al agregado del flujo de repuestos
- Esto evita que filas dummy/historicas contaminen el buscador de `repairs` aunque sigan existiendo en el registry para auditoria o pruebas puntuales.

### Evidencia funcional
- `npm run smoke:web` OK
- `npm run qa:route-parity` OK
- No se detectaron imports rotos ni navegacion a paths inexistentes en el router auditado.
