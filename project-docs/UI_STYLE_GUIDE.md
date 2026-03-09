# UI_STYLE_GUIDE

## Propósito

Definir la identidad visual oficial de `NicoReparaciones` para que admin, tienda y cuenta evolucionen como un solo producto.

Este documento gobierna tono visual, jerarquía, consistencia y UX. La implementación técnica vive en `next-stack/apps/web/src/styles.css` y en los primitives de `next-stack/apps/web/src/components/ui`.

## Dirección visual oficial

### Admin

Estilo: `Clean SaaS / Admin moderno claro`

Debe transmitir:
- orden
- control
- escaneabilidad
- profesionalismo
- baja fricción operativa

### Tienda

Estilo: `Clean eCommerce minimal`

Debe transmitir:
- confianza
- claridad
- foco en producto
- compra rápida
- navegación liviana

### Cuenta usuario

Estilo: `capa intermedia entre tienda y admin`

Debe transmitir:
- continuidad con el producto
- estados claros
- seguimiento simple
- estructura confiable

## Principios UX obligatorios

1. claridad antes que decoración
2. consistencia antes que creatividad aislada
3. jerarquía visual evidente en cada vista
4. responsive real, no maquillaje
5. estados críticos visibles: loading, empty, error, success, warning
6. una acción primaria por bloque
7. admin, tienda y cuenta comparten ADN visual, pero no densidad ni tono idénticos

## Paleta canónica

### Neutros
- fondo app: `#F7F8FA`
- fondo sutil: `#F3F5F7`
- superficie: `#FFFFFF`
- borde suave: `#E4E7EC`
- borde fuerte: `#D0D5DD`
- texto principal: `#101828`
- texto secundario: `#475467`
- texto tenue: `#667085`

### Primario
- primario: `#2563EB`
- hover: `#1D4ED8`
- soft: `#EFF6FF`
- borde primario suave: `#BFDBFE`

### Semánticos
- success: verde limpio
- warning: ámbar sobrio
- error: rojo limpio
- info: azul claro
- accent: índigo suave para estados intermedios

## Tipografía

Base:
- sans moderna
- legible
- jerarquía corta y firme

Jerarquía:
- page title: `28-36px`, peso `800/900`
- section title: `20-24px`, peso `800`
- card title: `16-18px`, peso `700/800`
- body: `14-16px`
- auxiliar / metadata: `12-13px`
- labels técnicas: `11-12px`, tracking leve

## Espaciado

Escala base:
- `4, 8, 12, 16, 20, 24, 32, 40, 48`

Reglas:
- separación entre bloques principales: `24-32`
- padding de cards: `16-20`
- ritmo vertical de formularios: `12-16`
- toolbars y filtros: `12-16`

## Bordes, radios y sombras

- radio base controles: `12-14`
- radio de cards: `16-18`
- pills y badges: `999px`
- sombras sutiles, sólo para separar superficies
- evitar sombras duras, halos y bordes negros pesados

## Iconografía y motion

- iconografía minimal, preferentemente `lucide-react`
- sin emojis como recurso de interfaz
- motion corto y sutil: `120-180ms`
- sin rebotes ni animaciones ornamentales

## Reglas por componente

### Botones
- una sola semántica primaria real
- outline para acciones secundarias
- ghost para acciones de bajo peso
- danger sólo para acciones destructivas
- evitar overrides repetidos por pantalla

### Inputs y selects
- mismo alto base
- borde suave
- foco visible y consistente
- label y hint claros
- selects con el mismo lenguaje visual que inputs

### Cards y secciones
- superficie blanca
- header opcional consistente
- separación clara entre título, descripción y acciones
- variantes por tono, no redefiniciones locales

### Badges
Semántica unificada:
- `neutral`
- `info`
- `accent`
- `success`
- `warning`
- `danger`

### Empty / loading states
- título claro
- descripción corta
- CTA útil cuando corresponda
- skeletons o placeholders consistentes, no sólo texto plano

## Contextos visuales canónicos

### Admin
- `PageShell context="admin"`
- `PageHeader context="admin"`
- densidad media, lectura rápida, foco en control

### Tienda
- `PageShell context="store"`
- `PageHeader context="store"`
- más aire visual, más protagonismo del catálogo

### Cuenta
- `PageShell context="account"`
- `PageHeader context="account"`
- tono intermedio, más estructurado que tienda y menos denso que admin

## Lo que se debe evitar

- glassmorphism dominante
- brutalismo
- gradientes pesados
- fondos oscuros como base
- sombras duras
- clases inline con `!important` como estrategia principal
- mezclar wrappers de tienda dentro de admin de forma sistemática
- dejar copy roto, enums crudos o etiquetas inconsistentes

## Adopción inicial ya aplicada

La primera fase real de implementación ya dejó esta base activa en:
- `AppShell`
- `AdminDashboardPage`
- `AdminSettingsHubPage`
- `StorePage`
- `MyAccountPage`
- `MyOrdersPage`

La siguiente fase debe expandir este lenguaje a admin core, catálogo, carrito, checkout y seguimiento de reparaciones.
