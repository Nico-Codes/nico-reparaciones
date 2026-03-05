# Migración total a React + NestJS + Prisma + PostgreSQL

## Estado actual

Este directorio (`next-stack/`) contiene la base del nuevo stack, creada en paralelo al sistema Laravel existente para migrar sin perder referencia funcional.

## Stack objetivo

- Frontend: React + TypeScript + Tailwind CSS + shadcn/ui
- Backend: NestJS + TypeScript + Zod (contratos/validación compartida)
- DB: PostgreSQL + Prisma
- Versionado/Deploy: Git + GitHub (cuando decidas publicar)

## Estrategia recomendada (sin romper negocio)

### Fase 1: Base técnica (hecha en esta etapa)
- Monorepo con `apps/api`, `apps/web`, `packages/contracts`
- API NestJS con `/api/health`
- Prisma configurado con esquema inicial base
- Web React con UI base y componentes `shadcn-ready`

### Fase 2: Dominio y autenticación (próxima)
- Migrar modelos reales desde MySQL/Laravel a Prisma (completo)
- Auth NestJS (email/password + Google opcional)
- Verificación de correo y recuperación de contraseña
- Roles `USER/ADMIN` + guards

### Fase 3: Módulos core del negocio
- Tienda + categorías + producto
- Carrito + checkout + pedidos
- Reparaciones + pricing rules + WhatsApp logs
- Admin dashboard + alertas + configuración

### Fase 4: Cutover (cuando esté validado)
- E2E del nuevo stack
- Migración de datos final
- Freeze de Laravel
- Deploy

## Cómo ejecutar (una vez instaladas dependencias)

1. `cd next-stack`
2. `copy .env.example .env` (o crear `.env`)
3. `docker compose up -d`
4. `npm install`
5. `npm run db:generate`
6. `npm run db:migrate`
7. `npm run db:migrate:dev -- --name <nombre>` (solo si necesitas crear una migracion nueva en un entorno compatible)
8. `npm run dev:api`
9. `npm run dev:web`

## Próximo objetivo concreto recomendado

Migrar **Auth + User + sesión** primero. Todo lo demás depende de eso.
