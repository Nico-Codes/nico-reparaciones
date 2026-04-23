# WHATSAPP_CLOUD_API_INTEGRATION

## Estado actual

NicoReparaciones ya tenia:

- templates configurables por canal (`orders`, `repairs`)
- logs `WhatsAppLog`
- triggers automaticos para pedidos, reparaciones y venta rapida

Esta fase agrega el envio real por Meta WhatsApp Cloud API reutilizando esa base.

## Variables necesarias

Se leen desde `next-stack/.env`:

- `WHATSAPP_CLOUD_ENABLED`
- `WHATSAPP_CLOUD_ACCESS_TOKEN`
- `WHATSAPP_CLOUD_PHONE_NUMBER_ID`
- `WHATSAPP_CLOUD_VERIFY_TOKEN`
- `WHATSAPP_CLOUD_API_VERSION`
- `WHATSAPP_CLOUD_BASE_URL`

Defaults:

- `WHATSAPP_CLOUD_ENABLED=0`
- `WHATSAPP_CLOUD_API_VERSION=v23.0`
- `WHATSAPP_CLOUD_BASE_URL=https://graph.facebook.com`

## Flujo implementado

1. Un trigger de negocio crea un `WhatsAppLog` con estado `PENDING`.
2. El mismo flujo llama a `WhatsappService.createAndDispatchLog(...)`.
3. El servicio construye un payload de texto para Meta Cloud API.
4. Si Meta acepta el mensaje:
   - `status -> SENT`
   - se guarda `remoteMessageId`
   - se guarda `providerStatus`
   - se completa `sentAt`
5. Si Meta rechaza o falla la llamada:
   - `status -> FAILED`
   - se guarda `errorMessage`
   - se completa `failedAt`

## Canales hoy conectados

- cambio de estado de pedidos admin
- cambio de estado de reparaciones admin
- confirmacion de venta rapida
- creacion manual de log desde admin

## Webhook minimo

Se implementa:

- `GET /api/whatsapp/webhook`
  - verificacion de Meta usando `hub.verify_token`
- `POST /api/whatsapp/webhook`
  - procesa `entry[].changes[].value.statuses[]`
  - actualiza `providerStatus`
  - si Meta reporta `failed`, marca el log `FAILED`

## Estructura real del log

Campos agregados/relevantes:

- `provider`
- `remoteMessageId`
- `providerStatus`
- `errorMessage`
- `lastAttemptAt`
- `sentAt`
- `failedAt`
- `updatedAt`

Estados operativos del log:

- `PENDING`
- `SENT`
- `FAILED`

## Limitacion importante de esta fase

La integracion reutiliza los templates actuales del proyecto como **mensaje libre de texto** (`type: text`).

Eso implica:

- el envio real funciona tecnicamente contra Meta Cloud API
- pero para mensajes iniciados fuera de la ventana de atencion de 24h, Meta puede rechazar el envio si no se migra a templates aprobados por Meta

Esta fase no migra el sistema a `template messages` aprobados por Meta. Solo activa el envio real usando la infraestructura actual.

## Pendientes razonables para una fase posterior

- reintentos automaticos
- cola/worker dedicado
- templates aprobados por Meta
- estados mas ricos (`delivered`, `read`) en UI
- recepcion de mensajes entrantes
- phone data real para pedidos normales, porque hoy el dominio `Order` no persiste telefono del cliente

## Validacion real con Meta

Estado al 2026-03-13:

- la integracion HTTP real ya esta implementada
- el entorno local auditado en esta fase **no** tiene cargadas credenciales reales:
  - `WHATSAPP_CLOUD_ENABLED`
  - `WHATSAPP_CLOUD_ACCESS_TOKEN`
  - `WHATSAPP_CLOUD_PHONE_NUMBER_ID`
  - `WHATSAPP_CLOUD_VERIFY_TOKEN`
  - `WHATSAPP_CLOUD_API_VERSION`
  - `WHATSAPP_CLOUD_BASE_URL`
- por eso **no fue posible** validar envio real contra Meta Cloud API desde este entorno

Lo que si quedo validado en esta fase:

- el gate tecnico completo del proyecto sigue en verde
- `smoke:backend` y los logs de WhatsApp quedaron sanos despues de corregir mojibake historico
- la integracion sigue lista para envio real apenas se carguen credenciales validas

Lo que sigue pendiente para declarar validacion real con Meta:

1. cargar credenciales reales en `next-stack/.env`
2. exponer un `WEB_URL`/endpoint publico alcanzable por Meta para el webhook
3. ejecutar pruebas reales de:
   - reparacion -> envio -> `SENT` / `FAILED`
   - venta rapida -> envio -> `SENT` / `FAILED`
   - `GET /api/whatsapp/webhook` con verify token real
   - `POST /api/whatsapp/webhook` con evento real de estado

Conclusion operativa:

- el sistema **ya esta listo tecnicamente** para usar Meta Cloud API
- todavia **no puede declararse validado contra Meta real** porque faltan credenciales reales y webhook publico en el entorno actual

## Modo manual asistido en reparaciones

Estado al 2026-04-23:

- cada detalle admin de reparacion puede obtener un borrador de WhatsApp renderizado con las plantillas editables del canal `repairs`;
- el backend devuelve telefono normalizado, mensaje final, `openUrl`, `canSend`, modo `manual` y estado de Cloud;
- al abrir el CTA manual se puede registrar un log con `meta.deliveryMode = manual`;
- este fallback es el modo operativo recomendado mientras Cloud API siga sin credenciales reales o sin templates oficiales aprobados por Meta.

Regla operativa:

- Cloud API queda como preparacion tecnica;
- el producto diario no debe depender de Cloud para avisar al cliente;
- la automatizacion final requiere templates oficiales de Meta por estado.
