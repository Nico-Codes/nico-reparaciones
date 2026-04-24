# BACKEND_MAP

## Backend operativo

Ubicacion:
- `next-stack/apps/api`

## Modulos principales cargados

- `HealthModule`
- `HelpModule`
- `MailModule`
- `AuthModule`
- `AdminModule`
- `CartModule`
- `CatalogAdminModule`
- `DeviceCatalogModule`
- `OrdersModule`
- `PricingModule`
- `RepairsModule`
- `StoreModule`
- `PrismaModule`

## Modulos internos ya seccionados

- `AdminModule`
  - facade principal en `admin.service.ts`
  - subservicios activos para dashboard, settings, brand assets, communications, finance, warranty registry y providers
  - `providers` ahora se organiza como facade + registry + search orchestration + helpers de parsing/ranking
- `RepairsModule`
  - facade principal en `repairs.service.ts`
  - subservicios activos para flujo admin, flujo publico, pricing snapshots, timeline, notificaciones y soporte/serializacion
- `OrdersModule`
  - facade principal en `orders.service.ts`
  - subservicios activos para checkout/mis pedidos, flujo admin, ventas rapidas, notificaciones y soporte/serializacion
  - el checkout y soporte de orden ahora distinguen `INVENTORY` vs `SPECIAL_ORDER`; las lineas por encargue no validan ni descuentan stock local y guardan snapshot de fulfillment en `OrderItem`
- `CatalogAdminModule`
  - facade principal en `catalog-admin.service.ts`
  - subservicios activos para categorias, productos, pricing de productos, importacion de encargues y soporte compartido
  - `Category` ya no es plana: soporta `parentId` con un solo nivel de profundidad (`padre -> subcategoria`)

## Seguridad

- `JwtAuthGuard`
- `RolesGuard`
- roles `USER` y `ADMIN`
- throttling, logging, health endpoints, correo SMTP y 2FA admin
- `AuthModule` ahora tambien expone auth social por redirect para cuentas `USER`, con Google y Apple. Ambos providers usan vinculacion por email para clientes, discovery publico de disponibilidad (`/api/auth/social/providers`) y callback de completado con `result token` corto en fragmento, sin tokens finales en query string

## Catalogo tecnico y pricing de reparaciones

- el backend no cambio el modelo del arbol tecnico:
  - `DeviceType -> DeviceBrand -> DeviceModelGroup -> DeviceModel`
  - `DeviceIssueType` depende de `DeviceType`
- la nueva hub frontend `/admin/calculos/reparaciones` hidrata todo reutilizando endpoints ya existentes de:
  - `AdminModule` para `device-types`, `model-groups` y `assign-model-group`
  - `DeviceCatalogModule` para `brands`, `models` y `issues`
  - `RepairsModule` para `pricingRulesList`
- `AdminModule` ahora tambien expone `DELETE /api/admin/device-types/:id` para permitir borrado real del tipo cuando no existan marcas, fallas, reparaciones ni reglas asociadas

## Store publico

- `StoreModule` expone endpoints publicos separados para compatibilidad:
  - `GET /api/store/hero`
  - `GET /api/store/branding`
  - `GET /api/store/categories`
  - `GET /api/store/products`
  - `GET /api/store/products/:slug`
- `GET /api/store/home` es el agregado recomendado para la carga inicial de `/store`; devuelve hero, branding, categorias y primera pagina de productos con defaults publicos.
- `GET /api/store/categories` y `GET /api/store/home` ahora devuelven categorias top-level con `children` anidados y `productsCount` agregado por padre.
- `GET /api/store/products?category=` conserva la ruta, pero cambio la semantica del filtro:
  - slug de padre: incluye productos directos del padre y de sus hijas activas
  - slug de hija: filtra exacto por esa subcategoria
- La visibilidad publica de productos ahora depende tambien de `fulfillmentMode`:
  - `INVENTORY`: visible solo si `active=true` y `stock > 0`
  - `SPECIAL_ORDER`: visible si `active=true` y `supplierAvailability != OUT_OF_STOCK`
- Los assets de `apps/web/public` servidos por API tienen headers de cache explicitos: largo para defaults versionables y corto/revalidable para `brand-assets/*` administrables.

## Catalogo comercial: encargues

- `Product` ahora soporta dos modos de cumplimiento:
  - `INVENTORY`
  - `SPECIAL_ORDER`
- El circuito de importacion por encargue se apoya en:
  - `SpecialOrderImportProfile` para configuracion reusable por proveedor/listado
  - `SpecialOrderImportBatch` para auditoria del texto importado y su resumen
  - `specialOrderProfileId + specialOrderSourceKey` como clave de upsert
- `CatalogAdminController` expone endpoints admin nuevos:
  - `GET /api/catalog-admin/special-order-profiles`
  - `POST /api/catalog-admin/special-order-profiles`
  - `PATCH /api/catalog-admin/special-order-profiles/:id`
  - `POST /api/catalog-admin/special-order-imports/preview`
  - `POST /api/catalog-admin/special-order-imports/apply`
- El parser de listados:
  - detecta encabezados de seccion `*Marca*`/`*Categoria*`
  - extrae precios USD y estados `Sin Stock`
  - ignora ruido operativo como fechas, links y cabeceras repetidas
- La aplicacion del batch:
  - crea categorias faltantes cuando el mapping asi lo define
  - crea/actualiza productos `SPECIAL_ORDER` sin tocar slug ni retoques manuales como imagen/descripcion
  - marca `OUT_OF_STOCK` si el item sigue viniendo pero sin stock
  - desactiva automaticamente productos del perfil que ya no aparecen en el listado nuevo

## Categorias comerciales y pricing

- `Category` soporta jerarquia de un nivel con:
  - `parentId nullable`
  - relacion `parent/children`
  - rechazo explicito de ciclos, autoasignacion y nietos en `catalog-admin-categories.service.ts`
- `CatalogAdminController` acepta `parentId` en create/update de categorias y el listado admin devuelve:
  - `depth`
  - `directProductsCount`
  - `totalProductsCount`
  - `childrenCount`
  - `pathLabel`
- `CatalogAdminProductsService` extiende el filtro `categoryId`:
  - si apuntas a un padre, incluye productos del padre y de sus hijas
  - si apuntas a una hija, mantiene filtro exacto
- `CatalogAdminPricingService` amplia la resolucion de reglas por categoria:
  - categoria exacta del producto
  - categoria padre
  - regla global
- La migracion inicial crea/reutiliza `Accesorios` y mueve debajo `Cables`, `Cargadores` y `Templados` cuando ya existian.

## Observacion clave

No existe ya backend legacy dentro del repo. Todo comportamiento servidor activo parte de `next-stack/apps/api`.

## Hotspot actual recomendado

- `admin-provider-search.service.ts` ya bajo a una fachada chica y la complejidad de scraping quedo seccionada en helpers especificos.
- `admin-provider-search.service.ts` ahora separa con claridad:
  - `searchProviderParts()` para busqueda directa puntual por proveedor
  - `searchPartsAcrossProviders()` para agregado del flujo de reparaciones, filtrado solo a proveedores con `searchInRepairs=true`
  - `filterProviderSearchItems()` como gating comun de matching exacto + ranking
- `catalog-admin.service.ts` ya bajo a una fachada chica y el modulo quedo separado por categorias, productos y pricing.
- `catalog-admin-special-order.service.ts` absorbe la orquestacion del preview/apply de encargues para no volver a engordar la fachada principal.
- El siguiente hotspot backend por servicio pasa a ser `admin-provider-registry.service.ts`; a nivel helper tecnico, `admin-provider-search.parsers.ts` sigue siendo el bloque de scraping mas pesado.
- El hotspot mas grande del repo completo sigue estando en frontend: `RepairProviderPartPricingSection.tsx`.
- Recomendacion prioritaria: si seguimos bajando complejidad del backend, conviene decidir entre partir `admin-provider-registry.service.ts` o pasar al hotspot grande de frontend en `repairs`.

## Proveedores de repuestos: estado actual

- `Supplier` ahora incluye `searchInRepairs` para distinguir proveedores reales del agregado de repuestos frente a filas dummy/historicas.
- `importDefaultProviders()` sincroniza por nombre canonico y tambien normaliza:
  - `searchEndpoint`
  - `searchConfigJson`
  - `searchPriority`
  - `searchEnabled`
  - `searchInRepairs`
- Proveedores canonicos actualmente marcados para agregado:
  - `PuntoCell`
  - `Evophone`
  - `Celuphone`
  - `Okey Rosario`
  - `Novocell`
  - `Electrostore`
  - `El Reparador de PC`
  - `Tienda Movil Rosario`
- Perfiles/transportes vigentes mas relevantes:
  - `Evophone`: endpoint JSON TNTSearch
  - `Okey Rosario`: endpoint JSON Flatsome live search
  - `Electrostore`: endpoint JSON Flatsome live search
  - `El Reparador de PC`: JSON API
  - `Celuphone`, `Novocell`, `Tienda Movil Rosario`, `PuntoCell`: HTML/provider profile
- La politica actual de matching es `exacta solamente` en el agregado:
  - sin variantes automaticas
  - sin aliases
  - sin expansion por grupo/modelo
  - si no hay match exacto util, se prefiere `0 resultados`

## Repairs: WhatsApp al cliente

- `RepairsNotificationsService` concentra la construccion del mensaje WhatsApp por estado de reparacion y ahora sirve tanto para:
  - dispatch `cloud` por cambio de estado
  - borrador `manual` para apertura asistida desde admin
- `RepairsController` expone dos endpoints admin nuevos:
  - `GET /api/repairs/admin/:id/whatsapp-draft`
  - `POST /api/repairs/admin/:id/whatsapp-manual-log`
- `WhatsappService` suma `createManualLog()` para guardar trazabilidad manual sin intentar dispatch por Meta.
- La separacion `manual` vs `cloud` se guarda en `meta.deliveryMode`; no hay migracion ni columna nueva en `WhatsAppLog`.
