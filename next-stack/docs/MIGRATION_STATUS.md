# Migration Status (Legacy -> Next Stack)

Fecha de corte: 2026-03-06

## Resumen ejecutivo

- Estado global estimado: **99%**
- Bloque funcional (backend + frontend conectado): **cerrado**
- Paridad de rutas legacy: **cerrada**
- Riesgo principal restante: **deploy productivo real + sign-off visual manual final**

## Qué ya está cerrado

### Backend (NestJS + Prisma)
- Auth completo (`login/register/me/refresh/verify/forgot/reset`) con guards y roles.
- Admin con endpoints reales: dashboard, users, settings, SMTP, templates mail/WhatsApp, help, 2FA.
- Flujos de negocio conectados: tienda, carrito/quote, checkout, pedidos, reparaciones.
- Catálogo técnico, pricing y módulos operativos (proveedores, garantías, contabilidad, ventas rápidas).
- Migraciones/seed Prisma estables (`qa:backend:full` OK).

### Frontend (React + TS)
- Rutas públicas/admin funcionando.
- Alias legacy críticos mapeados (`qa:route-parity` OK).
- Vistas admin específicas implementadas y navegables.
- Assets visuales legacy migrados (logo, héroes, favicons, iconos).

### QA y operación
- `qa:backend:full` OK
- `qa:route-parity` OK
- `qa:frontend:e2e` OK
- `qa:admin:visual` OK
- `qa:visual-parity` OK
- `qa:responsive:visual` OK (`artifacts/responsive-visual/20260306-103458/report.md`)
- `qa:legacy:detach` OK
- `qa:migration:close` OK
- `db:fix-mojibake:dry-run --include-products` OK (`rowsChanged=0`)

## Qué falta para 100%

1. **Deploy productivo real** (VPS/hosting, dominio, SSL, PM2/Nginx, monitoreo).
2. **Sign-off visual manual final** (desktop/tablet/mobile) sobre el entorno destino.
3. **Corte operativo legacy**: pasar Laravel a modo histórico/no activo en operación diaria.

## Técnico no bloqueante

- Optimizar chunks de Vite (>500kB) para mejorar carga inicial en producción.

## Criterio de cierre 100%

- Gate técnico en verde (`qa:migration:close`).
- Aprobación visual manual final documentada.
- Deploy productivo ejecutado y validado.
- Legacy fuera de operación activa.
