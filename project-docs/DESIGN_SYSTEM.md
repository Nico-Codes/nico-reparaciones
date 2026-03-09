# DESIGN_SYSTEM

## Objetivo

Traducir la dirección visual oficial de `NicoReparaciones` a una base técnica mantenible dentro de `next-stack/apps/web`.

## Capa técnica canónica

Implementación principal:
- `next-stack/apps/web/src/styles.css`
- `next-stack/apps/web/src/components/ui/button.tsx`
- `next-stack/apps/web/src/components/ui/page-shell.tsx`
- `next-stack/apps/web/src/components/ui/page-header.tsx`
- `next-stack/apps/web/src/components/ui/section-card.tsx`
- `next-stack/apps/web/src/components/ui/status-badge.tsx`
- `next-stack/apps/web/src/components/ui/empty-state.tsx`
- `next-stack/apps/web/src/components/ui/loading-block.tsx`
- `next-stack/apps/web/src/components/ui/text-field.tsx`
- `next-stack/apps/web/src/components/ui/filter-bar.tsx`

## Tokens activos

La base visual actual ya quedó tokenizada en `styles.css` con variables `--nr-*` para:
- background app
- superficies
- bordes
- textos
- color primario
- semánticos de estado
- sombras
- contexto de shell

Tokens activos clave:
- `--nr-bg-app`
- `--nr-surface`
- `--nr-border-soft`
- `--nr-border-strong`
- `--nr-text-strong`
- `--nr-text-body`
- `--nr-text-muted`
- `--nr-primary`
- `--nr-primary-hover`
- `--nr-primary-soft`
- `--nr-primary-border`
- `--nr-success`
- `--nr-warning`
- `--nr-danger`
- `--nr-info`
- `--nr-accent`
- `--nr-shadow-xs`
- `--nr-shadow-sm`
- `--nr-shadow-md`

## Primitives canónicos

### Button
Archivo:
- `next-stack/apps/web/src/components/ui/button.tsx`

Variantes activas:
- `default` -> primario
- `secondary` -> soft
- `outline`
- `ghost`
- `danger`

Regla:
- `Button` pasa a ser el entrypoint recomendado
- `btn-primary`, `btn-outline`, `btn-ghost` sobreviven como compatibilidad CSS, no como estrategia futura

### PageShell
Archivo:
- `next-stack/apps/web/src/components/ui/page-shell.tsx`

Contextos:
- `admin`
- `store`
- `account`

Función:
- separar visualmente la experiencia por contexto sin crear tres apps distintas

### PageHeader
Archivo:
- `next-stack/apps/web/src/components/ui/page-header.tsx`

Responsabilidad:
- eyebrow
- título
- subtítulo
- acciones

### SectionCard
Archivo:
- `next-stack/apps/web/src/components/ui/section-card.tsx`

Responsabilidad:
- superficie estándar de contenido
- variante base para módulos, formularios, métricas y bloques de lectura

Tonos activos:
- `default`
- `muted`
- `info`

### StatusBadge
Archivo:
- `next-stack/apps/web/src/components/ui/status-badge.tsx`

Tonos activos:
- `neutral`
- `info`
- `accent`
- `success`
- `warning`
- `danger`

Uso recomendado:
- todos los estados de pedidos y reparaciones deben mapearse a este set

### EmptyState
Archivo:
- `next-stack/apps/web/src/components/ui/empty-state.tsx`

Uso recomendado:
- vistas vacías
- búsquedas sin resultados
- estados iniciales sin datos

### LoadingBlock
Archivo:
- `next-stack/apps/web/src/components/ui/loading-block.tsx`

Uso recomendado:
- skeleton simple y rápido para cards, listados y formularios

### TextField
Archivo:
- `next-stack/apps/web/src/components/ui/text-field.tsx`

Uso recomendado:
- formularios auth
- filtros
- formularios de cuenta
- formularios admin

### FilterBar
Archivo:
- `next-stack/apps/web/src/components/ui/filter-bar.tsx`

Uso recomendado:
- filtros superiores
- toolbars de búsqueda y orden
- atajos por contexto

## Shell y navegación

Archivo base:
- `next-stack/apps/web/src/layouts/AppShell.tsx`

Decisión aplicada:
- el shell global sigue siendo único
- la percepción cambia por `data-shell-context`
- admin, tienda y cuenta ya no comparten exactamente el mismo tono visual

Contextos activos:
- `admin`: más ancho, más panel, más densidad útil
- `store`: más aire, foco en compra
- `account`: ancho más contenido y tono intermedio

## Convenciones activas

### Headers de página
- usar `PageHeader`
- no crear headers ad-hoc salvo excepciones justificadas

### Secciones
- usar `SectionCard`
- evitar mezclar `card`, `card-head`, wrappers inline y estructuras distintas para el mismo patrón

### Estados
- usar `StatusBadge`
- no crear badges manuales nuevos fuera del set semántico

### Formularios
- usar `TextField` como patrón base para inputs simples
- mantener `CustomSelect` para selects complejos ya existentes

### Toolbars y filtros
- usar `FilterBar`
- evitar mezclar filtros y contenido sin separación visual clara

## Adopción ya realizada

Vistas que ya adoptan esta base:
- `AdminDashboardPage`
- `AdminSettingsHubPage`
- `StorePage`
- `MyAccountPage`
- `MyOrdersPage`

## Pendiente para la siguiente fase

Prioridad alta:
- `AdminOrdersPage`
- `AdminRepairsListPage`
- `CartPage`
- `CheckoutPage`
- `StoreProductDetailPage`
- `MyRepairsPage`
- `OrderDetailPage`
- `RepairDetailPage`

## Antipatrones prohibidos a partir de ahora

- nuevos wrappers `store-shell` para vistas admin o cuenta
- badges inventados fuera del set canónico
- botones inline con tamaños/radios arbitrarios como norma
- copy con emojis o encoding roto en archivos tocados
- page headers resueltos a mano si el patrón ya está cubierto por `PageHeader`
