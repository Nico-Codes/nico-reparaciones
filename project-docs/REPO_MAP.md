# REPO_MAP

## Vista general del repo

Raiz confirmada:

- `C:\xampp\htdocs\nico-reparaciones`

## Estructura principal observada

### Legacy Laravel en raiz

- `app/`
- `bootstrap/`
- `config/`
- `resources/`
- `routes/`
- `database/`
- `public/`
- `tests/`
- `vendor/`
- `artisan`
- `composer.json`
- `package.json`

### Nuevo stack

- `next-stack/apps/api`
- `next-stack/apps/web`
- `next-stack/packages/contracts`
- `next-stack/scripts`
- `next-stack/docs`
- `next-stack/artifacts` (generada por QA; purgada en Fase 3, reaparece al correr auditorias visuales)

### Documentacion y soporte adicional

- `docs/` root
- `nico-dev.bat`
- `playwright.config.js`
- `scripts/` root
- PDFs historicos del proyecto

## Que es legacy

Se considera legacy o historico funcionalmente secundario:

- la aplicacion Laravel de la raiz
- su `public/`
- su base de datos SQLite de soporte
- sus scripts y docs de operacion historica

Importante: legacy sigue siendo util para algunos procesos del repo:

- paridad visual automatizada
- referencia historica de rutas
- scripts de migracion de settings, imagenes y assets

## Que es el nuevo stack operativo

Operativo real hoy:

- `next-stack/apps/web`
- `next-stack/apps/api`
- `next-stack/packages/contracts`
- `next-stack/scripts`
- `next-stack/docs`

`next-stack/package.json` concentra los comandos modernos de QA, DB y cierre de migracion.

## Carpetas operativas hoy

Alta prioridad operativa:

- `next-stack/apps/web/src`
- `next-stack/apps/api/src`
- `next-stack/apps/api/prisma`
- `next-stack/packages/contracts/src`
- `next-stack/scripts`
- `nico-dev.bat`

Prioridad operativa media:

- `next-stack/apps/web/public`
- `next-stack/docs`
- `docs/` root

## Carpetas historicas, auxiliares o candidatas a limpieza futura

Historicas o de soporte:

- `app/`, `resources/`, `routes/`, `config/`, `bootstrap/` root
- `public/` root
- PDFs historicos en raiz
- `tmp_evophone_product.html` (eliminado en Fase 3)
- archivo `npm` vacio en raiz (eliminado en Fase 3)

Generadas o auxiliares:

- `playwright-report/` (purgado en Fase 3; regenerable)
- `test-results/` (purgado en Fase 3; regenerable)
- `next-stack/artifacts/` (purgado en Fase 3; regenerable)
- `next-stack/.dev-logs/` (regenerable; puede quedar bloqueado si hay procesos dev activos)
- `next-stack/.qa-*.log`
- `next-stack/api-dev.log` (purgado en Fase 3; regenerable)
- `database/*.sqlite`

Estas no deben borrarse sin politica clara. Varias son ignoradas por git y sirven para QA o debugging.

## Scripts relevantes encontrados

Raiz:

- `nico-dev.bat`
- `scripts/e2e-critical.mjs`
- `scripts/e2e-serve.mjs`

`next-stack/scripts`:

- `env-check.mjs`
- `deploy-check.mjs`
- `smoke-api.mjs`
- `smoke-backend.mjs`
- `smoke-web.mjs`
- `qa-backend-full.mjs`
- `qa-route-parity.mjs`
- `qa-frontend-e2e.mjs`
- `qa-admin-visual-audit.mjs`
- `qa-visual-parity.mjs`
- `qa-responsive-visual.mjs`
- `qa-legacy-detach.mjs`

## Documentacion relevante existente

Root `docs/`:

- `OPERACION_PRODUCCION.md`
- `PREHOSTING_CHECKLIST.md`
- `BAT_SCRIPTS_GUIDE.md`
- `MAIL_QA_CIERRE.md`
- `LOCAL_READY_CHECK.md`
- `E2E_LOCAL_READY_CHECK.md`
- `CONOCIMIENTO_COMPLETO_NICOREPARACIONES.txt`

`next-stack/docs/`:

- `MIGRATION_STATUS.md`
- `MIGRATION_ROADMAP.md`
- `LEGACY_ROUTE_PARITY.md`
- `UI_PARITY_FINAL_CHECKLIST.md`
- `PREHOSTING_CHECKLIST.md`
- `DEPLOY_VPS_UBUNTU.md`
- `FIRST_START_RUNBOOK.md`
- `BACKUP_RESTORE_RUNBOOK.md`

## Comandos relevantes detectados

En `next-stack/package.json`:

- `npm run dev`
- `npm run dev:api`
- `npm run dev:web`
- `npm run build`
- `npm run typecheck`
- `npm run qa:backend:full`
- `npm run qa:route-parity`
- `npm run qa:frontend:e2e`
- `npm run qa:admin:visual`
- `npm run qa:visual-parity`
- `npm run qa:responsive:visual`
- `npm run qa:legacy:detach`
- `npm run qa:migration:close`
- `npm run db:*`

En `nico-dev.bat`:

- `next-setup`
- `next-start`
- `next-stop`
- `next-qa`
- `next-preprod`
- `next-close`

## Observaciones de gobernanza

- El repo tiene dos capas documentales previas: `docs/` root y `next-stack/docs/`.
- El repo no tenia `AGENTS.md` persistente en raiz.
- La nueva carpeta `project-docs/` debe servir como capa de contexto vivo y gobernanza, separada de runbooks operativos.

