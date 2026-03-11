# Frontend QA Hardening

## Objetivo
Auditoría funcional profunda del frontend para corregir bugs reales de flujo, endurecer estados de carga/error y reducir inconsistencias entre store, cuenta, admin y auth sin rediseñar la UI.

## Flujos auditados
- Store / eCommerce
  - `CartPage`
  - `CheckoutPage`
- Cuenta usuario
  - `MyOrdersPage`
  - `MyRepairsPage`
  - `MyAccountPage`
  - `VerifyEmailPage`
- Admin core
  - `AdminDashboardPage`
  - `AdminOrdersPage`
  - `AdminSettingsHubPage`
- Admin secundario
  - `AdminProductsPage`
  - `AdminCategoriesPage`
- Auth / acceso
  - `AuthLayout`
  - `LoginPage`
  - `RegisterPage`
  - `ForgotPasswordPage`
  - `RequireAuth`
  - `RequireAdmin`

## Bugs confirmados y corregidos

### Store
1. `CartPage` permitía navegar a checkout con un CTA visualmente "disabled" pero implementado como `Link`.
- Corrección: el CTA ahora es un `Button` real con `disabled` y navegación programática solo cuando el carrito es confirmable.

2. `CheckoutPage` confirmaba el pedido usando `cartStorage.getItems()` en bruto.
- Riesgo: si `quoteCart` normalizaba cantidades o eliminaba líneas inválidas, el payload podía no coincidir con el resumen mostrado.
- Corrección: el checkout ahora confirma usando únicamente `validCheckoutItems` derivados de la cotización válida.

3. `CheckoutPage` mostraba un empty state engañoso cuando el carrito existía pero todos los ítems quedaban inválidos.
- Corrección: se distingue entre carrito vacío y carrito con productos que requieren revisión.

4. `CheckoutPage` no normalizaba el carrito local después de cotizar.
- Corrección: si la cotización ajusta líneas válidas, el storage local se actualiza para mantener consistencia con `CartPage`.

### Cuenta usuario
5. `MyOrdersPage` seguía mostrando `paymentMethod` crudo, generando etiquetas inconsistentes (`EFECTIVO`, `DEBITO`, etc.).
- Corrección: ahora usa `paymentMethodLabel()` compartido.

6. `VerifyEmailPage` tenía una CTA incorrecta: "Cambiar email en mi cuenta" redirigía a `/orders`.
- Corrección: ahora apunta a `/mi-cuenta`.

7. `MyAccountPage` tenía validación local débil.
- Problemas:
  - guardaba perfil sin cambios útiles
  - validaba confirmación de contraseña después de entrar en estado loading
  - no diferenciaba errores de carga de errores del formulario
- Corrección:
  - trim/normalización de nombre y email
  - guardado de perfil solo si hay cambios reales
  - validación local previa para contraseña y longitud mínima
  - errores separados para página, perfil y contraseña

### Admin
8. `AdminDashboardPage` mapeaba estados de pedidos con claves viejas en inglés (`PENDING`, `CONFIRMED`, etc.) mientras el backend ya opera con claves actuales en español (`PENDIENTE`, `CONFIRMADO`, etc.).
- Riesgo: métricas por estado mal contadas o mal rotuladas.
- Corrección: el dashboard ahora reutiliza `order-ui` y `repair-ui` como fuente única de labels/tonos, y normaliza estados antes de contar.

9. `AdminDashboardPage` mostraba un selector de rango interactivo sin efecto real.
- Problema: la UI permitía cambiar `7/30/90 días`, pero ni frontend ni backend usaban ese valor.
- Corrección: se eliminó la falsa interacción y se reemplazó por información real del panel (`generatedAt`, aprobaciones, pedidos en flujo).

### Auth
10. `LoginPage`, `RegisterPage` y `ForgotPasswordPage` seguían con controles legacy y validaciones pobres.
- Corrección:
  - inputs unificados con `TextField`
  - botones reales con `Button`
  - trim/normalización local
  - mensajes de error más claros
  - estados de submit deshabilitados cuando la entrada ya es obviamente inválida

11. `RequireAuth` y `RequireAdmin` no reaccionaban a cambios de sesión ya iniciados.
- Riesgo: si la sesión se invalidaba en otra pestaña o por una limpieza local, la vista protegida podía quedar montada hasta un refresh manual.
- Corrección: ambos guards ahora sincronizan contra `storage`, `focus` y el evento local `nico:auth-changed`.

12. `VerifyEmailPage` intentaba ofrecer reenvío incluso sin sesión ni token.
- Riesgo: UX rota, error evitable y CTA engañosa para usuarios que abrían la ruta sin contexto.
- Corrección: ahora distingue entre confirmación con token, reenvío autenticado y estado sin contexto, mostrando `EmptyState` con CTAs correctas.

13. `VerifyEmailPage` dejaba el usuario local con `emailVerified` potencialmente desfasado después de confirmar.
- Corrección: tras una verificación exitosa con sesión abierta, refresca `authApi.account()` y actualiza `authStorage`.

### Admin adicional
14. `AdminOrdersPage` quedaba expuesto a respuestas obsoletas y acciones duplicadas.
- Problemas:
  - búsquedas/filtros rápidos podían renderizar resultados viejos
  - el detalle podía mostrar una respuesta previa si el usuario cambiaba de pedido rápido
  - el cambio de estado podía dispararse más de una vez
- Corrección:
  - protección por `requestId` para listado y detalle
  - limpieza del detalle mientras cambia la selección
  - bloqueo temporal por `updatingOrderId` para evitar dobles cambios

15. `AdminProductsPage` permitía acciones repetidas y guardado rápido de stock sin cambios reales.
- Problemas:
  - filtros rápidos podían dejar resultados stale
  - toggles/patches por producto podían dispararse repetidos
  - el guardado rápido de stock estaba habilitado aunque el valor no hubiera cambiado
- Corrección:
  - protección por `requestId` en el listado
  - `pendingProductIds` por producto para bloquear mutaciones concurrentes
  - `QuickStockEditor` solo habilita guardar cuando hay un valor válido y realmente distinto

16. `AdminCategoriesPage` dejaba toggle/eliminación expuestos a doble disparo y aceptaba submit local pobre.
- Corrección:
  - protección por `requestId` para cargas
  - `pendingActionId` para bloquear acciones repetidas por categoría
  - validación local de nombre/slug antes de guardar

## Hardening aplicado
- Deshabilitación real de acciones críticas durante carga o cuando la operación es inválida.
- Normalización local antes de enviar datos a la API.
- Mejores mensajes de error/éxito en formularios sensibles.
- Diferenciación entre errores de carga y errores de formulario.
- Guards reactivos ante cambios reales de sesión.
- Protección frente a respuestas obsoletas en listados/lista+detalle del admin.
- Bloqueo de mutaciones concurrentes por entidad cuando el flujo lo requería.
- Anchors de QA estables agregados a páginas vivas:
  - `data-store-shell`
  - `data-my-orders-page`
  - `data-my-repairs-page`
  - `data-my-account-page`

## Validaciones ejecutadas
- `npm run typecheck --workspace @nico/api`
- `npm run typecheck --workspace @nico/web`
- `npm run build --workspace @nico/api`
- `npm run build --workspace @nico/web`
- `npm run smoke:backend`
- `npm run smoke:web`
- `npm run qa:route-parity`
- `npm run qa:frontend:e2e`

## Pendientes razonables
- Barrido adicional de copy/encoding en algunas vistas activas no tocadas en esta fase.
- Revisión funcional más profunda de módulos secundarios admin si aparecen bugs nuevos en uso real.
- Eventual consolidación de más formularios auth/cuenta sobre primitives reutilizables si se expanden los flujos.

## Reparaciones admin: alta y detalle

### Hallazgos reales
1. `AdminRepairCreatePage` validaba solo nombre y presupuesto.
- Riesgos:
  - telefono con formato claramente invalido
  - submit doble si el operador insistia durante red lenta
  - error del catalogo mezclado con error de alta
  - catalogo/manual sin fallback suficientemente claro

2. `AdminRepairDetailPage` mezclaba error de carga con error de guardado y no refrescaba el historial tras editar.
- Riesgos:
  - timeline stale despues de guardar
  - UX de exito/error ambigua
  - PATCH disparado aunque no hubiera cambios
  - respuestas stale si se abria otro caso rapido

### Correcciones aplicadas
- Alta:
  - validacion local de telefono y dinero opcional
  - `maxLength` alineados al backend real
  - `catalogReloadToken` y retry explicito cuando falla el catalogo
  - campos de catalogo seleccionados usados como fallback visible para marca/modelo/falla
  - submit protegido contra doble envio
  - formulario y selects deshabilitados durante submit

- Detalle / edicion:
  - separacion de `loadError`, `saveError`, `notice` y `fieldErrors`
  - validacion local de nombre, telefono, presupuesto y precio final
  - `hasChanges` real para evitar guardados vacios
  - PATCH solo con campos realmente modificados
  - refresco del detalle y del timeline luego de guardar
  - proteccion por `requestId` para evitar respuestas stale
  - feedback explicito cuando no hay cambios

### Validacion funcional adicional
- Flujo probado sobre frontend real:
  - listado admin -> CTA `Nueva reparacion`
  - ruta `/admin/repairs/create`
  - alta real con `repairsApi.adminCreate(...)`
  - redireccion al detalle creado
  - edicion y guardado posterior del caso
- Resultado:
  - CTA visible
  - ruta de create abre
  - detalle abre tras crear
  - guardado muestra aviso de exito
  - telefono y presupuesto quedan persistidos en pantalla

## Backlog menor resuelto

### Públicas / auth secundarias
1. `PublicRepairLookupPage` mezclaba mojibake, wrappers legacy y feedback ambiguo.
- Corrección:
  - copy normalizado
  - formulario pasado a primitives actuales
  - estado "no encontrado" convertido en `EmptyState` real
  - detalle del caso alineado con helpers compartidos de estados de reparación

2. `PublicRepairQuoteApprovalPage` mantenía copy roto y feedback pobre al abrir enlaces inválidos o al aprobar/rechazar.
- Corrección:
  - mensajes y labels normalizados
  - carga inicial con `LoadingBlock`
  - enlaces inválidos resueltos con `EmptyState`
  - decisión de presupuesto con CTAs y mensajes más claros

### Admin secundario
3. `AdminUsersPage` seguía con wrappers heredados y sin protección frente a respuestas stale ni mutaciones repetidas por usuario.
- Corrección:
  - migración al shell/admin primitives actuales
  - protección por `requestId` en el listado
  - bloqueo de cambios de rol duplicados por usuario con `pendingUserIds`
  - feedback explícito de éxito/error

4. `AdminQuickSalesPage` permitía búsquedas stale, doble agregado por código y acciones activas en estados inválidos.
- Corrección:
  - protección por `requestId` en la búsqueda manual
  - bloqueo real de `Agregar`, `Buscar` y `Confirmar` según estado
  - mensajes y labels más claros (`código de barras`, ticket vacío, etc.)
  - formularios auxiliares alineados a primitives actuales sin tocar el flujo principal
  - selector estable `data-qa="quick-sale-scan-code"` para que la automatización no dependa de placeholders visibles

5. `Admin2faSecurityPage` seguía con mojibake, un único mensaje mixto y feedback débil ante errores de carga o validación de códigos.
- Corrección:
  - copy normalizado
  - separación explícita entre error y éxito
  - validación local previa para códigos TOTP
  - estado vacío/reintento cuando no carga el estado inicial
  - ancla estable `data-admin-2fa-page` para que la QA no dependa del título visible

## Hardening adicional: modulos admin de negocio

### Hallazgos reales
1. `AdminUsersPage` seguia permitiendo intentos de cambio de rol sobre la cuenta actual y mantenia feedback poco estable durante refresh/filtros.
- Riesgos:
  - intento de auto-democion desde la UI, aunque el backend la rechazara
  - mensajes de exito/error mezclados con cargas posteriores
  - falta de un ancla estable de QA

2. `AdminQuickSalesPage` seguia siendo demasiado permisiva para uso de mostrador.
- Riesgos:
  - `addByCode` podia usar coincidencias parciales y agregar el primer item devuelto
  - la pantalla podia informar exito aunque la linea no fuera agregable por stock o estado
  - confirmacion posible con telefono invalido o lineas invalidas
  - requests de busqueda/agregado expuestos a feedback stale

3. `AdminProductsPage` conservaba dos debilidades menores por fila.
- Riesgos:
  - toggle de destacado clickeable mientras la mutacion seguia pendiente
  - refresh habilitado durante carga

4. `AdminCategoriesPage` seguia permitiendo guardar sin cambios reales y dejaba controles activos durante save.
- Riesgos:
  - submit redundante en edicion
  - acciones concurrentes sobre la categoria mientras ya se guardaba

### Correcciones aplicadas
- `AdminUsersPage`
  - bloqueo explicito del cambio de rol sobre la propia cuenta
  - limpieza de mensajes previos al refrescar/filtrar
  - selector deshabilitado por usuario pendiente o por autoedicion
  - copy normalizado y ancla `data-admin-users-page`

- `AdminQuickSalesPage`
  - `addByCode` endurecido para exigir coincidencia exacta por SKU o codigo de barras
  - `addToCart` devuelve resultado real y no informa exito si la linea no puede agregarse
  - validacion de telefono por digitos antes de confirmar
  - confirmacion bloqueada con lineas invalidas o carrito vacio
  - proteccion adicional contra requests stale en busqueda manual y agregado por codigo
  - controles principales deshabilitados mientras carga o confirma

- `AdminProductsPage`
  - refresh deshabilitado durante carga
  - toggle de destacado bloqueado mientras la mutacion del producto esta pendiente

- `AdminCategoriesPage`
  - deteccion de "sin cambios" en edicion antes del submit
  - botones de estado y limpieza deshabilitados mientras guarda
  - submit bloqueado cuando no hay cambios reales

### Validacion funcional adicional
- Gate completo en verde:
  - `typecheck` API y web
  - `build` API y web
  - `smoke:backend`
  - `smoke:web`
  - `qa:route-parity`
  - `qa:frontend:e2e`
- Resultado:
  - no quedaron mutaciones dobles en usuarios, venta rapida, productos o categorias
  - la automatizacion de frontend siguio verde despues del hardening
