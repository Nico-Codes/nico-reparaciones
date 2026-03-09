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
Estado: `pendiente`

Prioridad inmediata:
- `AdminOrdersPage`
- `AdminRepairsListPage`
- `AdminProduct*`
- `AdminBusinessSettingsPage`
- `AdminAlertsPage`

Objetivo:
- consolidar tablas/listados, filtros, badges de estado y acciones de fila

### Fase D — Tienda y conversión
Estado: `pendiente`

Prioridad inmediata:
- `StoreProductDetailPage`
- `CartPage`
- `CheckoutPage`

Objetivo:
- reforzar confianza visual y reducir fricción del flujo de compra

### Fase E — Cuenta usuario
Estado: `parcialmente iniciada`

Ya aplicado:
- `MyAccountPage`
- `MyOrdersPage`

Pendiente:
- `MyRepairsPage`
- `OrderDetailPage`
- `RepairDetailPage`

### Fase F — Pulido transversal
Estado: `pendiente`

Incluye:
- barrido de copy/encoding en vistas activas restantes
- revisión responsive detallada
- normalización de empty/loading states en todo el frontend
- revisión de accesibilidad visual básica

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
