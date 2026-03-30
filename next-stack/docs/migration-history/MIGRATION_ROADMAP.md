# Migración total a React + NestJS + Prisma + PostgreSQL

## Estado actual

`next-stack/` es la base principal del sistema nuevo y ya cubre el flujo funcional del negocio.

## Stack objetivo

- Frontend: React + TypeScript + Tailwind
- Backend: NestJS + TypeScript + Zod
- DB: PostgreSQL + Prisma
- Operación: scripts QA + runbooks

## Progreso por fases

### Fase 1: Base técnica
- Monorepo con `apps/api`, `apps/web`, `packages/contracts`
- API NestJS productiva en local
- Prisma con migraciones activas
- Web React operativa

Estado: **completa**

### Fase 2: Auth y dominio
- Auth completo (login/register/me/refresh/verify/forgot/reset)
- Roles/guards admin-user
- Tienda, carrito, checkout, pedidos
- Reparaciones, pricing, catálogo técnico

Estado: **completa**

### Fase 3: Admin y paridad
- Dashboard y módulos admin funcionales
- Rutas legacy mapeadas
- Migración de assets visuales
- WhatsApp/mail/help/settings conectados

Estado: **completa**

### Fase 4: Cierre de migración
- QA técnica de cierre (`qa:migration:close`) en verde
- Auditoría visual responsive automatizada en verde
- Chequeo de desacople legacy en verde
- Pendiente: deploy real + aprobación visual manual final

Estado: **en cierre**

## Comandos clave

1. `cd next-stack`
2. `npm install`
3. `npm run qa:migration:close`
4. `npm run qa:preprod`

## Definición de 100% cerrado

- QA técnica de cierre en verde
- Aprobación visual manual final (desktop/tablet/mobile)
- Deploy productivo ejecutado y validado
- Stack legacy fuera de operación activa
