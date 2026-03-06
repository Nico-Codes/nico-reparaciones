# BUSINESS_RULES

## Roles

Confirmados por Prisma:

- `USER`
- `ADMIN`

Regla operativa:

- rutas admin y endpoints admin requieren rol `ADMIN`
- usuario autenticado comun opera sus propios pedidos, reparaciones y cuenta

## Estados de pedidos

Confirmados por `schema.prisma`:

- `PENDIENTE`
- `CONFIRMADO`
- `PREPARANDO`
- `LISTO_RETIRO`
- `ENTREGADO`
- `CANCELADO`

Regla importante:

- no cambiar estos enums sin revisar backend, frontend, filtros, badges, templates y datos existentes

## Estados de reparaciones

Confirmados por `schema.prisma`:

- `RECEIVED`
- `DIAGNOSING`
- `WAITING_APPROVAL`
- `REPAIRING`
- `READY_PICKUP`
- `DELIVERED`
- `CANCELLED`

Regla importante:

- no cambiar estos enums sin revisar dashboard, filtros, templates, approval flow y reportes

## Pricing de reparaciones

Confirmado por `RepairPricingRule`:

- reglas con prioridad
- activas/inactivas
- filtros por:
  - tipo de dispositivo
  - marca
  - grupo de modelos
  - modelo
  - tipo de falla
- parametros:
  - `basePrice`
  - `profitPercent`
  - `calcMode`
  - `minProfit`
  - `minFinalPrice`
  - `shippingFee`

Regla a preservar:

- pricing depende del catalogo tecnico; no conviene desacoplarlo sin revisar `PricingModule`, `RepairsModule` y UI admin.

## Pricing de productos

Confirmado por `ProductPricingRule`:

- regla por categoria o producto
- margen porcentual
- prioridad
- costo minimo y maximo opcional
- activacion/inactivacion

Observacion:

- el dominio comercial usa pricing real en backend, pero hay que seguir tratando ciertas pantallas visuales del admin como sensibles antes de refactorizar.

## Branding dinamico

Confirmado por codigo y settings:

- branding publico consumido desde `GET /api/store/branding`
- hero consumido desde `GET /api/store/hero`
- assets gestionados desde admin via upload/reset
- assets fisicos en `apps/web/public`

Regla a no romper:

- branding no es solo visual; tambien impacta favicon, logos, hero y posiblemente metadatos visibles del sitio

## Settings via AppSetting

Confirmado por schema y modulos admin/store:

- `AppSetting` funciona como almacenamiento dinamico de configuracion
- se usa para datos del negocio, branding, templates y ajustes operativos

Regla a preservar:

- no reemplazar `AppSetting` sin mapa de claves real y migracion controlada

## Templates de correo y WhatsApp

Confirmado por endpoints admin:

- `GET/PATCH /api/admin/mail-templates`
- `GET/PATCH /api/admin/whatsapp-templates`
- `GET/PATCH /api/admin/whatsapp-logs`

Reglas a preservar:

- templates estan integrados con eventos reales de negocio
- cambios de claves o estructura impactan envios automaticos y trazabilidad

## Cuenta y autenticacion

Confirmado por contratos Zod y auth controller:

- password minima: 8 caracteres
- email obligatorio y valido para registro/login/recuperacion
- refresh token requerido para refresco
- `twoFactorCode` opcional en login

Regla a preservar:

- no cambiar payloads de auth sin revisar `@nico/contracts`, frontend auth y tests/E2E

## Restricciones tecnicas que tienen impacto funcional

- auth y carrito usan `localStorage` en frontend
- `App.tsx` contiene aliases legacy que hoy siguen siendo una capa de compatibilidad real
- `StoreModule` y branding publico dependen de assets del frontend
- `catalog-admin` y `admin` escriben sobre `apps/web/public`

## Reglas y zonas pendientes de validacion fina

Pendiente de validacion detallada:

- listado exacto de claves `AppSetting` en uso real por modulo
- politica exacta de mensajes por template de WhatsApp
- detalle completo de formulas de pricing por pantalla y excepciones historicas
- si existe una regla operativa formal para auth social en el nuevo stack
