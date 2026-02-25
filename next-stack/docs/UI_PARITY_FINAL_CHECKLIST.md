# UI Parity Final Checklist (Legacy -> Next Stack)

Objetivo: validar que las vistas clave del `next-stack` mantengan paridad visual y UX con el stack legacy (`Laravel/Blade`).

## Preparación

- Levantar legacy (`http://127.0.0.1:8000`)
- Levantar next-stack (`http://localhost:5174`)
- Usar el mismo dataset (o lo más parecido posible)
- Comparar en paralelo (dos ventanas)
- Probar en:
  - Desktop ancho (`>= 1280px`)
  - Tablet (`~768px`)
  - Mobile (`~390px`)

## Criterio de cierre

- Misma jerarquía visual (headers, filtros, paneles)
- Mismos estados visuales (hover/active/focus)
- Spacing y densidad equivalentes (sin “saltos” visibles)
- Comportamiento responsive equivalente
- Sin textos rotos / encoding / labels técnicos (enums)

## Vistas críticas (prioridad alta)

### 1) `/store` (Tienda) / `legacy /tienda`

- Hero:
  - imagen desktop/mobile correcta
  - alto visual equivalente
  - fade inferior natural
- Toolbar:
  - overlap con hero/fade igual
  - inputs/select/botones con misma densidad
  - sort mobile abre/cierra correctamente
- Categorías:
  - nav pills con mismo estilo/active
  - scroll horizontal en mobile
- Destacados:
  - card, imagen, price, badge, carrito
  - densidad y alturas estables
- Grilla:
  - cards compactas
  - hover de imagen
  - badge stock + btn cart
- Empty state:
  - copy equivalente
  - botones correctos

### 2) `/store/:slug` (Detalle producto)

- Breadcrumb
- Imagen principal (crop/object-fit)
- Título / badges de stock-destacado
- Caja de precio
- Selector de cantidad (`- / input / +`)
- CTA `Agregar al carrito`
- CTAs secundarios (`Ver carrito`, `Seguir comprando`)
- Texto de reparación (`Consultar reparacion`)

### 3) `/admin/orders`

- Hero + filtros en cabecera
- Tabs de estados con contador (nav-pill)
- Listado:
  - badge de estado con color legacy
  - densidad de filas/cards
- Panel detalle:
  - select estado + badge
  - bloques cliente/items
- Estados vacíos/cargando/error

### 4) `/admin/repairs`

- Hero + tabs de estados con contador
- Stats cards
- Panel Nueva reparación (densidad)
- Panel Reglas de cálculo
- Panel Listado y detalle:
  - bloque de filtros
  - listado (row/card density)
  - badge de estado legacy
  - detalle editable
  - timeline/historial
- Estados vacíos/cargando/error

## Vistas importantes (prioridad media)

- `/cart`
- `/checkout`
- `/orders`
- `/orders/:id`
- `/repairs`
- `/repairs/:id`
- `/admin`
- `/admin/products`
- `/admin/settings`
- `/admin/users`
- `/admin/mail-templates`
- `/admin/whatsapp`
- `/admin/help`
- `/admin/device-catalog`
- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/verify-email`

## Checklist visual global (todas las vistas)

- Header / navbar:
  - pills desktop
  - menú móvil
  - dropdown cuenta
  - carrito badge
- Footer:
  - spacing y tipografía
- Tipografía:
  - pesos (`font-black`, etc.)
  - tamaños por jerarquía
- Botones:
  - `btn-primary`
  - `btn-outline`
  - `btn-ghost`
  - focus ring visible
- Inputs/selects/textarea:
  - borde/ring/focus
  - alturas consistentes
- Cards:
  - radios
  - borde
  - sombra
  - padding interno
- Badges:
  - estados (orders/repairs)
  - stock

## Checklist funcional rápida (post UI)

- `/store` filtros y categorías no rompen layout
- `/store/:slug` agrega al carrito
- `/cart` update/remove/clear
- `/checkout` confirma pedido
- `/admin/orders` cambia estado
- `/admin/repairs` cambia estado + guarda detalle

## Cierre de etapa (marcar cuando esté listo)

- [ ] Paridad visual aceptada en vistas críticas
- [ ] Paridad visual aceptada en vistas medias
- [ ] Responsive validado (desktop/tablet/mobile)
- [ ] Sin textos rotos / encoding
- [ ] QA funcional rápida OK

