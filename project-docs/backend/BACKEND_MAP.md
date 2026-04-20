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
- `CatalogAdminModule`
  - facade principal en `catalog-admin.service.ts`
  - subservicios activos para categorias, productos, pricing de productos y soporte compartido

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

## Observacion clave

No existe ya backend legacy dentro del repo. Todo comportamiento servidor activo parte de `next-stack/apps/api`.

## Hotspot actual recomendado

- `admin-provider-search.service.ts` ya bajo a una fachada chica y la complejidad de scraping quedo seccionada en helpers especificos.
- `admin-provider-search.service.ts` ahora separa con claridad:
  - `searchProviderParts()` para busqueda directa puntual por proveedor
  - `searchPartsAcrossProviders()` para agregado del flujo de reparaciones, filtrado solo a proveedores con `searchInRepairs=true`
  - `filterProviderSearchItems()` como gating comun de matching exacto + ranking
- `catalog-admin.service.ts` ya bajo a una fachada chica y el modulo quedo separado por categorias, productos y pricing.
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
