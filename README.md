# NicoReparaciones

Estado actual del repositorio:

- stack operativo canonico: `next-stack/`
- root Laravel legacy: retirado del flujo operativo y en proceso de eliminacion total
- documentacion viva: `project-docs/`
- runbooks tecnicos del stack nuevo: `next-stack/docs/`
- contexto funcional/historico extendido: `docs/CONOCIMIENTO_COMPLETO_NICOREPARACIONES.txt`

## Stack activo

- Frontend: `React + TypeScript + Vite + Tailwind CSS`
- Backend: `NestJS + TypeScript + Prisma`
- Base principal: `PostgreSQL`
- Contratos compartidos: `next-stack/packages/contracts`

## Comandos principales

Desde la raiz:

- `nico-dev.bat setup`
- `nico-dev.bat start`
- `nico-dev.bat stop`
- `nico-dev.bat qa`
- `nico-dev.bat preprod`
- `nico-dev.bat close`

Directo sobre `next-stack/`:

```bash
npm --prefix next-stack install
npm --prefix next-stack run env:check
npm --prefix next-stack run dev:api
npm --prefix next-stack run dev:web
npm --prefix next-stack run smoke:backend
npm --prefix next-stack run smoke:web
npm --prefix next-stack run qa:route-parity
npm --prefix next-stack run qa:migration:close
```

## Fuente de verdad del repo

- arquitectura y gobernanza: `project-docs/`
- codigo operativo: `next-stack/apps/api`, `next-stack/apps/web`
- assets canonicos: `next-stack/apps/web/public`
- entorno canonico: `next-stack/.env`

## Notas

- No usar tooling Laravel root ni asumir que la raiz sigue siendo runtime valido.
- No reintroducir soporte legacy fuera de `project-docs/` sin una decision tecnica documentada.
- Antes de tocar partes sensibles del repo, revisar `AGENTS.md` y `project-docs/WORKFLOW_AI.md`.
