# UI_APPLICATION_PLAN

## Objetivo

Aplicar la mejora visual del frontend en bloques pequeños, medibles y reutilizables, evitando rediseños masivos sin base compartida.

## Estado del plan

### Fase A — Fundación visual
Estado: `completada`

Implementado:
- tokens visuales `--nr-*` en `styles.css`
- sistema de botones alineado con `Button`
- badges semánticos unificados
- primitives base:
  - `PageShell`
  - `PageHeader`
  - `SectionCard`
  - `StatusBadge`
  - `EmptyState`
  - `LoadingBlock`
  - `TextField`
  - `FilterBar`
- shell base con contexto visual por zona
- corrección de copy y encoding en los archivos tocados

Adopción inicial validada en:
- `AdminDashboardPage`
- `AdminSettingsHubPage`
- `StorePage`
- `MyAccountPage`
- `MyOrdersPage`

### Fase B — Shell y navegación
Estado: `completada parcialmente`

Implementado:
- `AppShell` ya distingue contexto `admin | store | account`
- mejora de copy y navegación interna canónica
- integración de reveals sobre nuevos primitives

Pendiente:
- barrido del resto de vistas que siguen usando wrappers de tienda
- limpieza adicional de menús y actions secundarios en módulos admin complejos

### Fase C — Admin core
Estado: `completada`

Ya aplicado:
- `AdminOrdersPage`
- `AdminRepairsListPage`

Objetivo:
- consolidar tablas/listados, filtros, badges de estado y acciones de fila

Pendiente:
- detalle admin de pedidos y reparaciones

### Fase D — Tienda y conversión
Estado: `iniciada`

Ya aplicado:
- `StoreProductDetailPage`
- `CartPage`
- `CheckoutPage`

Objetivo:
- reforzar confianza visual y reducir fricción del flujo de compra

Pendiente:
- refinado de `StorePage`
- estados de carrito/checkout en casos borde
- revisión final de confianza visual en confirmaciones y mensajes

### Fase E — Cuenta usuario
Estado: `completada`

Ya aplicado:
- `MyAccountPage`
- `MyOrdersPage`
- `MyRepairsPage`
- `OrderDetailPage`
- `RepairDetailPage`

Resultado:
- cuenta usuario ya usa shells correctos, estados semánticos, seguimiento visual y detalles agrupados sin wrappers heredados de tienda

### Fase F — Pulido transversal
Estado: `completada parcialmente`

Incluye:
- barrido de copy/encoding en vistas activas restantes
- revisión responsive detallada
- normalización de empty/loading states en todo el frontend
- revisión de accesibilidad visual básica

Ya aplicado:
- corrección de status maps erróneos en cuenta usuario
- limpieza de copy/encoding en listados y detalles de pedidos/reparaciones
- adopción de `progress-steps`, `account-record` y `fact-list`
- alineación de `AdminProductsPage`, `AdminProductCreatePage`, `AdminProductEditPage`, `AdminProductLabelPage`, `AdminBusinessSettingsPage` y `AdminAlertsPage`
- alineación de `AdminCategoriesPage`, `AdminOrderDetailPage` y `AdminRepairDetailPage`
- incorporación de `TextAreaField` y `choice-card` para formularios admin
- retiro/reducción de `btn-*`, `store-shell`, `store-hero` y wrappers visuales legacy en módulos secundarios activos
- barrido de mojibake y copy débil en detalles activos de cuenta (`OrderDetailPage`, `RepairDetailPage`)

Pendiente:
- barrido final de módulos no críticos con deuda visual baja
- revisión de copy residual en vistas activas fuera del bloque ya pulido

## Riesgos a controlar

- volver a crear estilos por pantalla sin pasar por primitives
- mantener wrappers de tienda dentro del admin
- introducir badges o botones nuevos fuera del set canónico
- dejar conviviendo patterns viejos y nuevos en la misma vista

## Regla de aplicación a partir de ahora

Cada mejora de pantalla debe:
1. priorizar primitives existentes
2. usar el contexto correcto (`admin`, `store`, `account`)
3. corregir copy/encoding del archivo tocado
4. evitar introducir estilos locales sin justificación
5. pasar typecheck, build y smoke

## Resultado de la fase actual

La fase actual dejó validada la base reusable en pantallas core del producto:
- admin operativo: `AdminOrdersPage`, `AdminRepairsListPage`
- flujo comercial: `StoreProductDetailPage`, `CartPage`, `CheckoutPage`
- cuenta usuario: `MyOrdersPage`, `MyRepairsPage`, `OrderDetailPage`, `RepairDetailPage`

Eso consolida como canónicos:
- `PageShell`
- `PageHeader`
- `SectionCard`
- `StatusBadge`
- `EmptyState`
- `LoadingBlock`
- `TextField`
- `FilterBar`
- `Button`
- `ProgressSteps`

El siguiente bloque recomendado es pulido fino residual sobre módulos no críticos y barrido final de consistencia/copy.

Estado actual:
- el frontend principal puede considerarse visualmente cerrado para las vistas activas core
- lo restante se concentra en quick wins secundarios fuera del flujo central del producto
