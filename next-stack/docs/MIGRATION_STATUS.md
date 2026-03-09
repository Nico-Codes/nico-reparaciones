# Migration Status (Legacy -> Next Stack)

Fecha de corte: 2026-03-09

## Resumen ejecutivo

- Estado global estimado del stack nuevo: **99% tecnico / local**
- Bloque funcional del nuevo stack: **cerrado**
- Paridad de rutas legacy: **cerrada**
- Riesgo principal restante: **deploy productivo real + retiro final del legacy root**

## Qué ya está cerrado

### Backend (NestJS + Prisma)
- Auth clasica completa (`login/register/me/refresh/verify/forgot/reset`) con guards y roles.
- Admin con endpoints reales: dashboard, users, settings, SMTP, templates mail/WhatsApp, help, 2FA.
- Flujos de negocio conectados: tienda, carrito/quote, checkout, pedidos, reparaciones.
- Catalogo tecnico, pricing y modulos operativos.

### Frontend (React + TS)
- Rutas publicas/admin funcionando.
- Alias legacy criticos mapeados (`qa:route-parity` OK).
- Vistas admin especificas implementadas y navegables.
- Assets visuales migrados al frontend nuevo.

### QA y operacion canonica
- `env:check` OK
- `qa:backend:full` OK
- `qa:route-parity` OK
- `qa:frontend:e2e` OK
- `qa:admin:visual` OK
- `qa:responsive:visual` OK
- `qa:legacy:detach` OK
- `qa:migration:close` OK

## Cambio importante sobre parity legacy

- `qa:visual-parity` deja de ser parte del gate canonico.
- La herramienta queda archivada como `legacy:parity:deprecated` en `next-stack/legacy-support/deprecated/qa/qa-visual-parity.mjs`.
- Motivo: fuerte dependencia del root Laravel con valor ya no proporcional al costo de mantenimiento.

## Qué falta para 100%

1. Deploy productivo real.
2. Sign-off visual/manual final en entorno destino.
3. Retiro fuerte del root Laravel historico.
