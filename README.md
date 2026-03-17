# NicoReparaciones

NicoReparaciones es una plataforma web para un negocio de reparacion de dispositivos y venta de electronica.

## Estado del proyecto

- migracion al nuevo stack: completada
- stack operativo unico: `next-stack/`
- root Laravel legacy: retirado del repositorio operativo
- documentacion viva: `project-docs/`
- runbooks tecnicos del stack actual: `next-stack/docs/`

## Stack actual

- Frontend: `React + TypeScript + Vite + Tailwind CSS`
- Backend: `NestJS + TypeScript + Prisma`
- Base de datos principal: `PostgreSQL`
- Contratos compartidos: `next-stack/packages/contracts`

## Estructura importante

- `next-stack/apps/web`: frontend React
- `next-stack/apps/api`: backend NestJS
- `next-stack/packages/contracts`: contratos compartidos
- `project-docs/`: contexto, arquitectura, reglas y decisiones
- `next-stack/docs/`: runbooks tecnicos del stack actual

## Primer arranque

### Desde la raiz
- `nico-dev.bat setup`
- `nico-dev.bat start`

`nico-dev.bat start` levanta API + Web y tambien intenta abrir un tunel `ngrok` hacia el frontend en `5174` si el entorno local tiene `ngrok` configurado via `%LOCALAPPDATA%\ngrok\ngrok.yml` o `NGROK_AUTHTOKEN`.

### Directo sobre el stack canonico
```bash
npm --prefix next-stack install
npm --prefix next-stack run db:generate
npm --prefix next-stack run env:check
npm --prefix next-stack run dev:api
npm --prefix next-stack run dev:web
```

## Checks principales

```bash
npm --prefix next-stack run env:check
npm --prefix next-stack run typecheck --workspace @nico/api
npm --prefix next-stack run typecheck --workspace @nico/web
npm --prefix next-stack run build --workspace @nico/api
npm --prefix next-stack run build --workspace @nico/web
npm --prefix next-stack run smoke:backend
npm --prefix next-stack run smoke:web
npm --prefix next-stack run qa:route-parity
npm --prefix next-stack run qa:legacy:detach
```

## Fuente de verdad del repo

- contexto y gobernanza: `project-docs/`
- codigo operativo: `next-stack/apps/api` y `next-stack/apps/web`
- assets canonicos: `next-stack/apps/web/public`
- entorno canonico: `next-stack/.env`

## Reglas de trabajo

- no reintroducir runtime legacy
- no crear segundas fuentes de verdad para assets, env o documentacion
- registrar decisiones tecnicas en `project-docs/DECISIONS_LOG.md`
- registrar cambios asistidos por IA en `CHANGELOG_AI.md`
- revisar `AGENTS.md` y `project-docs/WORKFLOW_AI.md` antes de cambios sensibles
