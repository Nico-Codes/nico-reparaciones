# REPAIR_PROVIDER_PART_PRICING_PLAN

## Proposito

Definir el camino tecnico para migrar al stack nuevo la feature completa de reparaciones basada en:

- proveedor
- repuesto / parte
- costo real
- reglas de pricing
- presupuesto final aplicado al caso

Esta fase es de auditoria y diseno. No implementa todavia el dominio nuevo.

## Estado despues de la Implementacion Fase 2

La Fase 1, la Fase 2 y una Fase 3 corta de UX/historial ya quedaron implementadas en el stack nuevo. El alcance real que ya existe es:

- schema Prisma con snapshots historicos de pricing de reparacion
- relacion opcional `Repair -> activePricingSnapshot`
- endpoint backend para busqueda normalizada de repuestos por proveedor:
  - `POST /api/admin/providers/:id/search-parts`
- endpoint backend para preview de calculo proveedor + repuesto + regla:
  - `POST /api/pricing/repairs/provider-part-preview`
- wrappers tipados en frontend para provider part search, preview y snapshot draft
- integracion real en `AdminRepairCreatePage` para:
  - elegir proveedor
  - buscar repuesto
  - pedir preview proveedor + repuesto + regla
  - usar sugerido
  - crear la reparacion con snapshot aplicado
- integracion real en `AdminRepairDetailPage` para:
  - ver snapshot activo
  - recalcular preview proveedor + repuesto + regla
  - usar sugerido
  - aplicar un snapshot nuevo al guardar
- persistencia del snapshot activo dentro del create/update de reparaciones
- serializacion del snapshot activo dentro de `repairs.adminDetail`
- serializacion de historial basico de snapshots en `repairs.adminDetail`
- visualizacion operativa en `AdminRepairDetailPage` de:
  - snapshot activo
  - snapshots historicos
  - estado activo/reemplazado
  - diferencia entre sugerido, aplicado y presupuesto actual
- trazabilidad adicional en timeline cuando:
  - se aplica un snapshot
  - se reemplaza el snapshot activo
  - se modifica manualmente el presupuesto despues del calculo

Lo que sigue pendiente para una fase futura, si se decide continuar:

- comparacion entre multiples resultados/proveedores
- timeline/auditoria mas rica del calculo aplicado
- posibilidad de reemplazar o cerrar snapshots sin pasar por un nuevo update del caso

## Estado actual confirmado

### Lo que ya existe en el stack nuevo

- `Repair` persiste `quotedPrice` y `finalPrice`, pero no proveedor ni repuesto:
  - `next-stack/apps/api/prisma/schema.prisma`
- existe motor real de reglas de pricing de reparacion:
  - `next-stack/apps/api/src/modules/pricing/pricing.controller.ts`
  - `next-stack/apps/api/src/modules/pricing/pricing.service.ts`
- existe UI admin para reglas de pricing de reparacion:
  - `next-stack/apps/web/src/features/admin/AdminRepairPricingRulesPage.tsx`
- existe modulo de proveedores con configuracion de busqueda externa:
  - `next-stack/apps/api/prisma/schema.prisma`
  - `next-stack/apps/api/src/modules/admin/admin.controller.ts`
  - `next-stack/apps/api/src/modules/admin/admin.service.ts`
  - `next-stack/apps/web/src/features/providers/AdminProvidersPage.tsx`
- existe integracion minima de `pricingResolve` en reparaciones admin:
  - `next-stack/apps/web/src/features/repairs/AdminRepairCreatePage.tsx`
  - `next-stack/apps/web/src/features/repairs/AdminRepairDetailPage.tsx`

### Lo que no existe hoy

- relacion `Repair -> Supplier`
- relacion `Repair -> repuesto/parte`
- entidad persistente de repuesto de proveedor
- snapshot historico del calculo aplicado a la reparacion
- seleccion de proveedor dentro de create/detail de reparacion
- seleccion de repuesto dentro de create/detail de reparacion
- calculo sobre costo real de repuesto/proveedor

## Que se pudo reconstruir de la feature legacy

### Evidencia fuerte

1. El proyecto sigue teniendo un modulo de proveedores orientado a busqueda de repuestos:
   - la UI dice explicitamente:
     - `Este orden se usa en la busqueda progresiva de repuestos`
     - `Habilitar busqueda de repuestos`
   - archivo:
     - `next-stack/apps/web/src/features/providers/AdminProvidersPage.tsx`

2. El proveedor actual guarda metadata de busqueda:
   - `searchEnabled`
   - `searchMode`
   - `searchEndpoint`
   - `searchConfigJson`
   - `searchPriority`
   - archivo:
     - `next-stack/apps/api/prisma/schema.prisma`

3. El backend actual de proveedores solo puede "probar" la busqueda y estimar cantidad de resultados, no devolver repuestos normalizados:
   - `probeProvider(...)`
   - `estimateProbeResultCount(...)`
   - `extractCountFromJsonPayload(...)`
   - archivos:
     - `next-stack/apps/api/src/modules/admin/admin.service.ts`

4. El motor actual de pricing de reparacion usa solo contexto tecnico del equipo/falla y texto libre:
   - `deviceTypeId`
   - `deviceBrandId`
   - `deviceModelGroupId`
   - `deviceModelId`
   - `deviceIssueTypeId`
   - `deviceBrand`
   - `deviceModel`
   - `issueLabel`
   - no usa proveedor ni costo real
   - archivo:
     - `next-stack/apps/api/src/modules/pricing/pricing.service.ts`

5. El dominio `Repair` actual no tiene ningun lugar donde persistir:
   - proveedor elegido
   - repuesto elegido
   - costo base aplicado
   - regla aplicada
   - archivo:
     - `next-stack/apps/api/prisma/schema.prisma`

6. Existe un patron de snapshot de costo/proveedor en otro dominio del negocio:
   - `WarrantyIncident` persiste:
     - `supplierId`
     - `unitCost`
     - `costOrigin`
     - `extraCost`
     - `lossAmount`
   - archivos:
     - `next-stack/apps/api/prisma/schema.prisma`
     - `next-stack/apps/web/src/features/warranties/AdminWarrantyCreatePage.tsx`

### Evidencia indirecta / inferencia razonable

Lo que probablemente hacia la feature legacy completa:

- seleccionar un proveedor habilitado para busqueda de repuestos
- ejecutar una busqueda sobre el proveedor elegido
- elegir un repuesto / resultado concreto
- tomar un costo real de ese resultado
- aplicar sobre ese costo una regla de pricing de reparacion
- usar el presupuesto calculado como base del caso

Esto es una inferencia fuerte porque:

- el modulo de proveedores conserva lenguaje y configuracion de busqueda de repuestos
- el motor de pricing ya existe por separado
- `Repair` hoy solo retiene el total, que es exactamente el gap pendiente

### Lo que NO pude reconstruir con certeza

Porque el runtime legacy ya no existe en el repo y no hay una especificacion tecnica completa preservada:

- si el legado persistia una sola opcion elegida o varias cotizaciones de proveedor
- si guardaba el repuesto completo o solo snapshots textuales del elegido
- si la regla aplicada quedaba persistida por ID, por nombre, o solo por monto final
- si el operador podia recalcular varias veces y guardar historial de calculos

Esto debe tratarse como `pendiente de validacion humana` si aparece evidencia externa al repo.

## Gaps reales del stack nuevo

1. El modulo de proveedores sirve para configurar y probar busquedas, pero no para devolver items seleccionables.
2. El motor `pricingResolve` calcula sobre reglas abstractas, no sobre costo real de proveedor.
3. `Repair` no tiene persistencia historica del calculo aplicado.
4. El frontend admin de create/detail ya tiene un lugar natural para integrar la feature, pero hoy solo consume sugerencia por reglas.
5. La impresion actual de reparacion muestra `Repuestos` como un 32% del total final, lo que confirma que hoy no hay un costo real persistido:
   - `next-stack/apps/web/src/features/repairs/AdminRepairPrintPage.tsx`
   - `next-stack/apps/web/src/features/repairs/AdminRepairTicketPage.tsx`

## Modelo de datos recomendado

### Decision de diseno

No conviene resolver esta feature agregando solo `supplierId` y algunos campos sueltos a `Repair`.

Eso seria insuficiente porque:

- no preserva historial
- no preserva el contexto exacto del calculo
- no protege contra cambios futuros en:
  - proveedor
  - endpoint remoto
  - regla
  - catalogo tecnico

### Modelo recomendado

#### 1. Mantener `Repair` como entidad principal del caso

`Repair` debe seguir guardando:

- `quotedPrice`
- `finalPrice`

Y agregar solo una referencia opcional al snapshot aplicado actual.

#### 2. Agregar `RepairPricingSnapshot`

Modelo recomendado:

```prisma
model RepairPricingSnapshot {
  id                        String   @id @default(cuid())
  repairId                  String
  source                    String
  supplierId                String?
  supplierNameSnapshot      String?
  supplierSearchQuery       String?
  supplierEndpointSnapshot  String?

  externalPartId            String?
  partSkuSnapshot           String?
  partNameSnapshot          String
  partBrandSnapshot         String?
  partUrlSnapshot           String?
  partAvailabilitySnapshot  String?
  quantity                  Int      @default(1)

  deviceTypeIdSnapshot      String?
  deviceBrandIdSnapshot     String?
  deviceModelGroupIdSnapshot String?
  deviceModelIdSnapshot     String?
  deviceIssueTypeIdSnapshot String?
  deviceBrandSnapshot       String?
  deviceModelSnapshot       String?
  issueLabelSnapshot        String?

  baseCost                  Decimal  @db.Decimal(12, 2)
  extraCost                 Decimal? @db.Decimal(12, 2)
  shippingCost              Decimal? @db.Decimal(12, 2)

  pricingRuleId             String?
  pricingRuleNameSnapshot   String?
  calcModeSnapshot          String?
  marginPercentSnapshot     Decimal? @db.Decimal(7, 2)
  minProfitSnapshot         Decimal? @db.Decimal(12, 2)
  minFinalPriceSnapshot     Decimal? @db.Decimal(12, 2)
  shippingFeeSnapshot       Decimal? @db.Decimal(12, 2)

  suggestedQuotedPrice      Decimal  @db.Decimal(12, 2)
  appliedQuotedPrice        Decimal? @db.Decimal(12, 2)
  manualOverridePrice       Decimal? @db.Decimal(12, 2)

  status                    String   @default("draft")
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
  appliedAt                 DateTime?

  repair                    Repair   @relation(fields: [repairId], references: [id], onDelete: Cascade)
  supplier                  Supplier? @relation(fields: [supplierId], references: [id], onDelete: SetNull)

  @@index([repairId, createdAt])
  @@index([supplierId])
  @@index([status])
}
```

#### 3. Agregar puntero al snapshot activo en `Repair`

```prisma
model Repair {
  ...
  activePricingSnapshotId String?
  activePricingSnapshot   RepairPricingSnapshot? @relation("RepairActivePricingSnapshot", fields: [activePricingSnapshotId], references: [id], onDelete: SetNull)
  pricingSnapshots        RepairPricingSnapshot[] @relation("RepairPricingSnapshots")
}
```

### Por que este modelo

- permite persistir el proveedor y el repuesto elegidos
- preserva el costo real usado en el calculo
- preserva la regla aplicada y sus valores en el momento del calculo
- evita drift historico si luego cambian:
  - el proveedor
  - el precio remoto
  - la regla
  - el catalogo tecnico
- permite recalcular sin perder trazabilidad

### Que NO conviene persistir como verdad viva

No conviene depender solo de:

- `supplierId`
- `pricingRuleId`
- datos vivos del proveedor

## Implementacion Fase 1 realizada

### Schema aterrizado

Se implemento en `next-stack/apps/api/prisma/schema.prisma`:

- enum `RepairPricingSnapshotSource`
- enum `RepairPricingSnapshotStatus`
- `Repair.activePricingSnapshotId`
- relacion `Repair.activePricingSnapshot`
- relacion `Repair.pricingSnapshots`
- modelo `RepairPricingSnapshot`

Campos persistidos en snapshot:

- proveedor:
  - `supplierId`
  - `supplierNameSnapshot`
  - `supplierSearchQuery`
  - `supplierEndpointSnapshot`
- repuesto:
  - `externalPartId`
  - `partSkuSnapshot`
  - `partNameSnapshot`
  - `partBrandSnapshot`
  - `partUrlSnapshot`
  - `partAvailabilitySnapshot`
  - `quantity`
- contexto tecnico:
  - `deviceTypeIdSnapshot`
  - `deviceBrandIdSnapshot`
  - `deviceModelGroupIdSnapshot`
  - `deviceModelIdSnapshot`
  - `deviceIssueTypeIdSnapshot`
  - `deviceBrandSnapshot`
  - `deviceModelSnapshot`
  - `issueLabelSnapshot`
- calculo:
  - `baseCost`
  - `extraCost`
  - `shippingCost`
  - `pricingRuleId`
  - `pricingRuleNameSnapshot`
  - `calcModeSnapshot`
  - `marginPercentSnapshot`
  - `minProfitSnapshot`
  - `minFinalPriceSnapshot`
  - `shippingFeeSnapshot`
  - `suggestedQuotedPrice`
  - `appliedQuotedPrice`
  - `manualOverridePrice`
- trazabilidad:
  - `status`
  - `createdAt`
  - `updatedAt`
  - `appliedAt`

### Endpoint de busqueda normalizada por proveedor

Implementado:

- `POST /api/admin/providers/:id/search-parts`

Input:

- `q`
- `limit` opcional

Salida normalizada por item:

- `externalPartId`
- `name`
- `sku`
- `brand`
- `price`
- `availability`
- `url`
- `rawLabel`

Notas:

- soporta proveedores `html` y `json`
- si faltan campos en origen, los degrada a `null` o `unknown`
- actualiza `lastProbe*` del proveedor con el resultado real de la busqueda

### Endpoint de preview proveedor + repuesto + regla

Implementado:

- `POST /api/pricing/repairs/provider-part-preview`

Input:

- `supplierId`
- `supplierSearchQuery`
- `quantity`
- `extraCost`
- `shippingCost`
- contexto tecnico:
  - `deviceTypeId`
  - `deviceBrandId`
  - `deviceModelGroupId`
  - `deviceModelId`
  - `deviceIssueTypeId`
  - `deviceBrand`
  - `deviceModel`
  - `issueLabel`
- `part`
  - `externalPartId`
  - `name`
  - `sku`
  - `brand`
  - `price`
  - `availability`
  - `url`

Salida:

- `matched`
- `input`
- `supplier`
- `part`
- `rule`
- `calculation`
- `snapshotDraft`

La regla abstracta `pricingResolve` sigue existiendo sin cambios de contrato.

## Fase 2 recomendada

La siguiente implementacion deberia limitarse a:

1. integrar la busqueda de proveedor/repuesto en `AdminRepairCreatePage`
2. integrar preview proveedor + repuesto + regla en create/detail
3. permitir `Usar sugerido`
4. persistir y aplicar `RepairPricingSnapshot`
5. mostrar snapshot activo en detalle admin

Sin snapshots, los casos viejos quedarian reinterpretados con reglas o costos futuros.

### Que NO conviene modelar todavia

No conviene crear en esta fase un catalogo interno completo de repuestos de proveedores.

Motivo:

- hoy el proveedor solo expone busqueda externa configurable
- no hay un dominio local estable de `SupplierPart`
- seria agrandar el alcance antes de validar bien el flujo operativo

## Backend necesario

### 1. Busqueda real de repuestos por proveedor

El `probeProvider` actual no alcanza.

Hace falta un endpoint nuevo, por ejemplo:

- `POST /api/admin/providers/:id/search-parts`

Payload sugerido:

```json
{
  "query": "modulo a30"
}
```

Respuesta normalizada sugerida:

```json
{
  "items": [
    {
      "externalId": "abc123",
      "title": "Modulo Samsung A30 OLED",
      "sku": "MOD-A30",
      "url": "https://proveedor.com/...",
      "price": 12000,
      "availability": "in_stock"
    }
  ]
}
```

### 2. Configuracion mas rica para parsing de resultados

`searchConfigJson` hoy alcanza solo para contar items (`items_path`).

Para soportar la feature completa, debe ampliarse para extraer:

- `items_path`
- `id_path`
- `name_path`
- `sku_path`
- `price_path`
- `availability_path`
- `url_path`

Sin eso, el backend no puede devolver repuestos normalizados.

### 3. Preview de calculo basado en proveedor + repuesto

No conviene sobrecargar `pricingResolve`, porque ese endpoint hoy resuelve una sugerencia abstracta desde el contexto tecnico.

Conviene agregar un endpoint dedicado, por ejemplo:

- `POST /api/repairs/admin/pricing/preview`

Payload sugerido:

```json
{
  "repairContext": {
    "deviceTypeId": "...",
    "deviceBrandId": "...",
    "deviceModelGroupId": "...",
    "deviceModelId": "...",
    "deviceIssueTypeId": "...",
    "deviceBrand": "Samsung",
    "deviceModel": "A30",
    "issueLabel": "Modulo"
  },
  "supplierId": "...",
  "supplierPart": {
    "externalId": "...",
    "sku": "MOD-A30",
    "title": "Modulo Samsung A30 OLED",
    "url": "https://...",
    "price": 12000,
    "availability": "in_stock"
  },
  "quantity": 1,
  "extraCost": 0,
  "shippingCost": 0
}
```

Respuesta:

- proveedor / parte elegidos
- costo base calculado
- regla encontrada o no
- sugerencia final
- snapshot preview no persistido aun

### 4. Persistir el calculo aplicado

Se necesita:

- al crear reparacion:
  - crear `Repair`
  - crear `RepairPricingSnapshot`
  - setear `activePricingSnapshotId`
  - copiar `appliedQuotedPrice` a `Repair.quotedPrice`

- en detalle:
  - recalcular preview
  - guardar snapshot
  - aplicar snapshot elegido al caso

Endpoints recomendados:

- `POST /api/repairs/admin`
  - extender para aceptar `pricingSnapshotDraft` opcional
- `POST /api/repairs/admin/:id/pricing-snapshots`
  - persistir snapshot calculado o manual
- `POST /api/repairs/admin/:id/pricing-snapshots/:snapshotId/apply`
  - marcar snapshot como aplicado al caso
- `GET /api/repairs/admin/:id/pricing-snapshots`
  - devolver historial resumido

### 5. Timeline / auditoria

Ademas del snapshot, conviene registrar eventos en `RepairEventLog` cuando:

- se calcula un preview
- se aplica un snapshot
- se reemplaza un snapshot activo
- el operador sobreescribe manualmente el presupuesto

Eso sirve como audit trail. No reemplaza al snapshot.

## Frontend / UX necesaria

## `AdminRepairCreatePage`

### Seccion nueva: `Proveedor y repuesto`

Ubicacion recomendada:

- entre `Catalogo tecnico opcional` y `Presupuesto sugerido`

Flujo propuesto:

1. Elegir proveedor
2. Buscar repuesto
3. Ver resultados normalizados
4. Seleccionar una opcion
5. Ver costo base y metadatos del repuesto
6. Recalcular presupuesto usando costo real + regla

Campos / acciones:

- `Proveedor`
- `Buscar repuesto`
- lista de resultados
- `Seleccionar`
- `Costo base`
- `Costo extra`
- `Envio`
- `Recalcular`
- `Usar sugerido`

Estados UX requeridos:

- sin proveedor
- proveedor sin busqueda habilitada
- buscando repuestos
- sin resultados
- resultado seleccionado
- sin regla aplicable
- sugerencia valida
- error de proveedor
- error de calculo

### Integracion con el alta actual

`quotedPrice` debe seguir siendo editable manualmente.

Regla UX:

- nunca sobrescribir `quotedPrice` automaticamente
- `Usar sugerido` debe ser explicito
- si el operador edita manualmente despues de usar sugerido, marcarlo como override manual

## `AdminRepairDetailPage`

### Seccion nueva o extension del bloque actual de pricing

El bloque `Presupuesto sugerido` actual puede evolucionar a:

- `Proveedor y repuesto actual`
- `Costo base actual`
- `Regla aplicada`
- `Presupuesto sugerido`
- `Presupuesto cargado`
- `Usar sugerido`
- `Guardar cambios`

### Historial de calculos

No hace falta una UI gigante en la primera fase completa.

Pero si conviene mostrar al menos:

- snapshot activo
- fecha de aplicacion
- proveedor
- repuesto
- costo base
- regla
- monto aplicado
- si hubo override manual

## Estrategia de migracion recomendada

### Recomendacion: Opcion B - por fases

No conviene una fase unica. El dominio mezcla:

- scraping / integracion externa
- snapshots historicos
- pricing
- create/detail de reparacion

### Fase 1

- agregar `RepairPricingSnapshot`
- agregar `activePricingSnapshotId` en `Repair`
- extender `searchConfigJson` para parsing de repuestos
- crear endpoint de busqueda real de repuestos por proveedor

### Fase 2

- crear endpoint de preview `proveedor + repuesto + regla`
- integrar `AdminRepairCreatePage`
- integrar `AdminRepairDetailPage`
- permitir crear y editar reparaciones con snapshot aplicado
- devolver `activePricingSnapshot` desde detalle admin

### Fase 3

- mejorar UX del snapshot activo
- exponer historial basico de snapshots
- hacer explicita la diferencia entre:
  - sugerido
  - aplicado
  - override manual
  - presupuesto actual del caso

### Fase 4

- opcional:
  - multiples opciones por proveedor
  - comparacion entre proveedores
  - mejoras mas profundas de timeline y auditoria

## Riesgos

### Riesgos de diseno

- si solo se agrega `supplierId` a `Repair`, se pierde trazabilidad del calculo
- si no se guarda snapshot del costo y de la regla, los casos historicos se vuelven inestables
- si se modela un catalogo local de repuestos demasiado pronto, el alcance explota sin evidencia de necesidad inmediata

### Riesgos de UX

- mezclar seleccion de proveedor/repuesto con el formulario actual sin separacion clara puede confundir al operador
- sobrescribir el presupuesto automaticamente seria UX enganosa

### Riesgos de compatibilidad

- `pricingResolve` actual es por reglas abstractas; no debe romperse ni sobrecargarse con semantics nuevas
- el flujo minimo actual de create/detail con sugerencia por reglas debe seguir funcionando mientras se migra la version completa

### Riesgos historicos

- recalcular usando datos vivos del proveedor puede cambiar casos viejos silenciosamente
- cambiar reglas vivas sin snapshot haria que un presupuesto pasado deje de ser auditable

## Recomendacion ejecutable

La implementacion correcta no es:

- agregar `supplierId` a `Repair`
- llamar al probe de proveedor
- copiar un precio suelto a `quotedPrice`

La implementacion correcta es:

1. crear snapshot historico del calculo
2. normalizar resultados de proveedor
3. separar preview de calculo vs aplicacion al caso
4. mantener `Repair.quotedPrice` como monto operativo, pero respaldado por snapshot cuando venga de proveedor/repuesto

## Estado final de esta fase

Se deja definido:

- que existe hoy
- que falta
- como modelarlo sin improvisar
- que endpoints hacen falta
- como deberia integrarse en create/detail
- por que conviene migrarlo por fases

## Estado final actual

La feature quedo en un punto util y operativamente valido:

- el backend ya resuelve repuestos normalizados por proveedor
- el backend ya calcula preview real usando proveedor + repuesto + regla
- create/detail admin ya permiten usar esa sugerencia de forma explicita
- el snapshot aplicado ya se persiste y queda asociado al caso
- el detalle admin ya muestra snapshot activo e historial basico

Lo que todavia no existe no es la base del sistema, sino mejoras de profundidad:

- comparacion entre varias opciones
- UX avanzada de seleccion/evaluacion multiple
- operaciones mas ricas sobre snapshots historicos

La implementacion puede seguir desde este documento sin reabrir el diseno del dominio.

## Estado actual despues de la integracion multi-proveedor

La UX principal de reparaciones admin ya no depende de elegir primero un proveedor puntual.

### Backend disponible

- `POST /api/admin/providers/search-parts`
  - busca el repuesto una sola vez contra todos los proveedores activos con busqueda habilitada
  - tolera fallos parciales por proveedor
  - devuelve resultados normalizados con metadata del proveedor
- `POST /api/admin/providers/:id/search-parts`
  - se conserva como fallback puntual por proveedor
- `POST /api/pricing/repairs/provider-part-preview`
  - sigue resolviendo preview proveedor + repuesto + regla

### Frontend disponible

- `AdminRepairCreatePage`
  - usa busqueda agregada multi-proveedor como flujo principal
  - mantiene un filtro puntual de proveedor como fallback operativo
- `AdminRepairDetailPage`
  - usa la misma UX reutilizable para recalcular sobre varios proveedores

### Contrato operativo de resultados agregados

Cada resultado normalizado expone:

- proveedor
- `externalPartId`
- `name`
- `sku`
- `brand`
- `price`
- `availability`
- `url`
- `rawLabel`

Ademas la respuesta agregada expone:

- resumen total de proveedores consultados
- cuantos devolvieron resultados
- cuantos fallaron
- detalle por proveedor con `status = ok | empty | error`

### Lo que sigue pendiente para una fase futura

- comparacion multiple mas rica entre varias opciones seleccionadas
- ranking mas sofisticado de mejores opciones
- acciones sobre snapshots historicos mas alla del snapshot activo

## Ajuste de calidad de busqueda multi-proveedor con proveedores reales

Se ajusto la integracion real para cinco proveedores operativos del negocio:

- `Evophone`
- `Okey Rosario`
- `Celuphone`
- `Novocell`
- `Electrostore`

### Perfiles de extraccion incorporados

La busqueda HTML ahora reconoce perfiles de tienda concretos:

- `woodmart`
  - usado para `Evophone`
- `flatsome`
  - usado para `Okey Rosario`
  - usado para `Electrostore`
- `shoptimizer`
  - usado para `Celuphone`
- `wix`
  - usado para `Novocell`

Eso permite:

- extraer mejor el titulo real del producto
- extraer mejor el precio real desde bloques WooCommerce/Wix
- filtrar URLs no producto
- evitar labels basura del tipo `Añadir al carrito`

### Normalizacion reforzada

La respuesta agregada mantiene el mismo contrato, pero ahora la calidad de datos es mejor:

- nombres mas limpios y comparables
- SKUs basura descartados
- precios WooCommerce/Wix parseados con miles/decimales reales
- disponibilidad mas consistente
- URLs mas confiables

### Ranking actual

El ranking agregado ahora prioriza:

1. coincidencia fuerte del nombre con la query completa
2. hits exactos de tokens especificos
3. resultados con precio real
4. resultados con stock/disponibilidad util
5. resultados con SKU o marca informativa

Tambien penaliza:

- coincidencias solo parciales
- resultados sin precio
- precios absurdamente bajos que suelen venir de parsing erroneo
- matches con muy pocos tokens utiles de la query

### Resultado esperado despues de este ajuste

Con una query real como `modulo samsung a10`, el top agregado ya deberia tender a mostrar primero proveedores con:

- match exacto sobre `A10`
- precio real util
- stock real o al menos estado consistente
- nombre especifico

Y dejar mas abajo:

- resultados genericos
- modelos cercanos pero no exactos (`A10E`, `A10S`) si no superan al match exacto
- precios basura producto de markup ambiguo
