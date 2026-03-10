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
  - `AdminSettingsHubPage`
- Auth / acceso
  - `AuthLayout`
  - `LoginPage`
  - `RegisterPage`
  - `ForgotPasswordPage`

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

## Hardening aplicado
- Deshabilitación real de acciones críticas durante carga o cuando la operación es inválida.
- Normalización local antes de enviar datos a la API.
- Mejores mensajes de error/éxito en formularios sensibles.
- Diferenciación entre errores de carga y errores de formulario.
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
