# Backend Business Rules Hardening

## Objetivo
Endurecer reglas de negocio criticas del backend para reducir payloads permisivos, transiciones de estado invalidas, mutaciones duplicadas y diferencias entre lo que el frontend muestra y lo que la API acepta.

## Modulos auditados
- `orders`
- `cart`
- `repairs`
- `catalog-admin`
- `auth` / guards / roles

## Hallazgos principales

### Orders / checkout / quick sales
- `adminUpdateStatus` aceptaba estados invalidos y los normalizaba implicitamente a `PENDIENTE`.
- checkout y quick sales decrementaban stock con un `update` simple despues de validar stock, dejando una ventana de carrera entre validacion y escritura.
- `cart/quote` aceptaba lineas repetidas del mismo producto y las evaluaba por separado.
- varios endpoints devolvian `200` con mensajes de validacion en vez de errores HTTP 4xx.
- quick sale aceptaba cualquier `paymentMethod` y lo degradaba a `local`.

### Repairs
- `normalizeStatus` degradaba estados desconocidos a `RECEIVED`.
- create y update aceptaban ids de catalogo tecnicamente opcionales, pero no validaban coherencia entre tipo, marca, modelo y falla.
- las transiciones de estado no estaban protegidas.
- el timeline podia registrar cambio de estado aunque el estado no hubiera cambiado realmente.

### Catalog / stock / categories
- alta y edicion de productos no verificaban existencia real de categoria.
- los errores de Prisma por slug, SKU o barcode duplicado se filtraban como errores genericos.
- categorias devolvian mensajes poco utiles ante conflictos o ids inexistentes.

### Auth / access
- el hardening de auth no requirio cambios estructurales: guards y roles ya estaban alineados con el frontend actual.
- se mantuvo `bootstrap-admin` porque sigue siendo parte del setup local del proyecto, pero no se ampliaron capacidades ni se relajaron reglas de acceso.

## Correcciones aplicadas

### Orders / checkout / quick sales
- `cart/quote` ahora consolida lineas repetidas por `productId` antes de calcular disponibilidad y totales.
- `adminUpdateStatus`:
  - rechaza estados invalidos con `400`
  - aplica matriz de transiciones valida
  - no hace cambios si el estado ya coincide
- checkout y quick sales:
  - usan decremento atomico por `updateMany ... stock >= quantity`
  - fallan con error claro si el stock ya no alcanza al confirmar
- quick sales:
  - solo acepta `local`, `mercado_pago` o `transferencia`
  - deja de degradar metodos desconocidos
- controladores de orders:
  - dejan de responder `200` en validaciones fallidas
  - devuelven `400` o `401` coherentes

### Repairs
- create y update validan:
  - `userId`
  - `deviceTypeId`
  - `deviceBrandId`
  - `deviceModelId`
  - `deviceIssueTypeId`
- se refuerza coherencia de catalogo:
  - marca debe pertenecer al tipo si ambos existen
  - modelo debe pertenecer a la marca si ambos existen
  - falla debe pertenecer al tipo si ambos existen
- `adminUpdateStatus` y `adminUpdate`:
  - rechazan estados invalidos
  - aplican matriz de transiciones valida
  - no generan side effects ni timeline en no-op
- el timeline distingue entre `STATUS_CHANGED` y `UPDATED`

### Catalog / stock / categories
- create/update product valida categoria real si se informa `categoryId`
- errores Prisma relevantes ahora se traducen a 4xx claros:
  - slug duplicado
  - SKU duplicado
  - barcode duplicado
  - categoria invalida o entidad inexistente
- create/update category traduce conflictos de slug y not found de forma consistente

## Reglas de negocio reforzadas

### Pedidos
- transiciones validas:
  - `PENDIENTE -> CONFIRMADO | CANCELADO`
  - `CONFIRMADO -> PREPARANDO | CANCELADO`
  - `PREPARANDO -> LISTO_RETIRO | CANCELADO`
  - `LISTO_RETIRO -> ENTREGADO | CANCELADO`
  - `ENTREGADO` y `CANCELADO` son terminales

### Reparaciones
- transiciones validas:
  - `RECEIVED -> DIAGNOSING | WAITING_APPROVAL | REPAIRING | READY_PICKUP | CANCELLED`
  - `DIAGNOSING -> WAITING_APPROVAL | REPAIRING | READY_PICKUP | CANCELLED`
  - `WAITING_APPROVAL -> REPAIRING | CANCELLED`
  - `REPAIRING -> READY_PICKUP | CANCELLED`
  - `READY_PICKUP -> DELIVERED | CANCELLED`
  - `DELIVERED` y `CANCELLED` son terminales

### Stock
- la confirmacion de compra y de venta rapida ya no depende de una lectura previa solamente.
- el decremento final exige stock suficiente en la misma escritura atomica.

## Validacion ejecutada
- `npm run typecheck --workspace @nico/api`
- `npm run typecheck --workspace @nico/web`
- `npm run build --workspace @nico/api`
- `npm run build --workspace @nico/web`
- `npm run smoke:backend`
- `npm run smoke:web`
- `npm run qa:route-parity`
- `npm run qa:frontend:e2e`

## Probes dirigidos adicionales
- `orders/admin/:id/status` rechaza estado invalido con `400`
- `repairs/admin/:id/status` rechaza estado invalido con `400`
- `catalog-admin/products` rechaza `categoryId` inexistente con `400`

## Pendientes reales
- auth fue auditado y no mostro una debilidad critica comparable dentro del alcance de esta fase.

## Fase 1 - proveedor + repuesto + calculo real (2026-03-11)

### Alcance implementado
- snapshots historicos de pricing de reparacion en Prisma
- busqueda normalizada de repuestos por proveedor
- preview backend de calculo proveedor + repuesto + regla

### Reglas endurecidas
- no se sobrecargo `pricingResolve`; el calculo proveedor + repuesto usa endpoint propio
- `search-parts` exige:
  - proveedor existente
  - busqueda habilitada
  - endpoint configurado
  - query valida
- `provider-part-preview` exige:
  - `supplierId` valido
  - contexto tecnico minimo
  - repuesto con `name` y `price`
  - payload sin ambiguedades silenciosas

### Contratos nuevos
- `POST /api/admin/providers/:id/search-parts`
- `POST /api/pricing/repairs/provider-part-preview`

### Resultado de negocio
- el backend ya puede devolver repuestos normalizados de proveedor sin persistir un catalogo local completo
- el backend ya puede calcular un presupuesto sugerido usando:
  - proveedor
  - repuesto seleccionado
  - costo real
  - extras/envio
  - regla aplicable
- el resultado ya devuelve `snapshotDraft` suficiente para la Fase 2 de UI + aplicacion real al caso

## Pasada corta final (2026-03-11)

### Hallazgos reales
- checkout normal seguia aceptando `paymentMethod` demasiado libre y persistia el valor recibido sin cerrarlo contra una lista explicita.
- `orders/admin` seguia tolerando filtros de `status` invalidos y los convertia en un listado mas amplio de lo esperado.
- `orders/admin/quick-sales` seguia tolerando filtros `payment` invalidos y los degradaba silenciosamente a "sin filtro".
- `repairs/admin` seguia tolerando filtros `status` invalidos y devolvia resultados ambiguos en vez de rechazar el input.

### Correcciones aplicadas
- checkout normal ahora normaliza y limita `paymentMethod` a:
  - `efectivo`
  - `transferencia`
  - `debito`
  - `credito`
- checkout acepta alias tolerables para no romper el frontend actual ni entradas razonables:
  - `cash` / `local` -> `efectivo`
  - `transfer` -> `transferencia`
  - `debit` -> `debito`
  - `credit` -> `credito`
- si `paymentMethod` llega informado y no coincide con un valor valido o alias soportado, checkout responde `400`.
- `orders/admin` ahora responde `400` si `status` es invalido, en vez de ampliar silenciosamente el filtro.
- `orders/admin/quick-sales` ahora responde `400` si `payment` es invalido, en vez de ampliar silenciosamente el filtro.
- `repairs/admin` ahora responde `400` si `status` es invalido, en vez de ampliar silenciosamente el filtro.

### Reglas de negocio reforzadas en esta pasada
- checkout normal deja de persistir metodos arbitrarios o inconsistentes.
- los filtros admin invalidos dejan de producir resultados ambiguos "porque no matchearon"; ahora fallan explicitamente.
- la API mantiene compatibilidad con el frontend actual, pero reduce tolerancia peligrosa a entradas malformadas.

### Validacion adicional relevante
- `orders/admin?status=NOPE` -> `400`
- `orders/admin/quick-sales?payment=NOPE` -> `400`
- `repairs/admin?status=NOPE` -> `400`
- el probe dirigido de checkout con `paymentMethod` invalido quedo condicionado al dataset demo actual: no habia un producto comprable valido para ejecutar una compra completa real, pero el contrato quedo cerrado por codigo y por el resto del gate en verde.
