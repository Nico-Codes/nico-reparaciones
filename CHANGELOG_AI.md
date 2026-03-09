# Bitacora de cambios asistidos por IA

## Formato sugerido

### YYYY-MM-DD - Actor/Agente
- Alcance:
- Tipo de intervencion:
- Archivos tocados:
- ¿Cambio comportamiento funcional?: Si/No
- Validaciones ejecutadas:
- Riesgos / notas:

---

### 2026-03-09 - Codex
- Alcance: Fase 4F para sacar parity legacy y migradores legacy del flujo normal del repo.
- Tipo de intervencion: deprecacion / archivado controlado + alineacion documental y de scripts.
- Archivos tocados:
  - `next-stack/package.json`
  - `next-stack/apps/api/package.json`
  - `next-stack/legacy-support/README.md`
  - `next-stack/legacy-support/deprecated/README.md`
  - `next-stack/legacy-support/deprecated/qa/qa-visual-parity.mjs`
  - `next-stack/legacy-support/deprecated/api/migrate-legacy-settings.ts`
  - `next-stack/legacy-support/deprecated/api/migrate-legacy-product-images.ts`
  - `next-stack/legacy-support/deprecated/api/migrate-legacy-visual-assets.ts`
  - `project-docs/PARITY_STRATEGY.md`
  - `project-docs/LEGACY_SUPPORT_MAP.md`
  - `project-docs/LEGACY_RETIREMENT_PLAN.md`
  - `project-docs/ROOT_LEGACY_POLICY.md`
  - `project-docs/ROOT_LEGACY_RETIREMENT_CHECKLIST.md`
  - `project-docs/CLEANUP_EXECUTION_PLAN.md`
  - `project-docs/CLEANUP_CANDIDATES.md`
  - `project-docs/OPEN_QUESTIONS.md`
  - `project-docs/DECISIONS_LOG.md`
  - `project-docs/WORKFLOW_AI.md`
  - `AGENTS.md`
  - `next-stack/docs/MIGRATION_STATUS.md`
  - `next-stack/docs/UI_PARITY_FINAL_CHECKLIST.md`
  - `next-stack/docs/LEGACY_ROUTE_PARITY.md`
- ¿Cambio comportamiento funcional?: No del producto. Si del tooling: parity legacy y migradores legacy quedaron fuera del flujo normal y del gate principal.
- Validaciones ejecutadas:
  - `npm run env:check`
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
- Riesgos / notas:
  - `legacy:parity:deprecated` y `legacy:migrate:*:deprecated` siguen existiendo solo como soporte historico/manual.
  - el siguiente paso razonable pasa a ser retirar duplicados root y avanzar sobre el retiro fuerte del root Laravel.

### 2026-03-09 - Codex
- Alcance: Fase 4G para retirar materialmente el root Laravel y consolidar el repo alrededor de `next-stack/`.
- Tipo de intervencion: cleanup estructural fuerte + reescritura de entrypoints + actualizacion documental.
- Archivos tocados:
  - eliminacion del runtime Laravel root (`app/`, `bootstrap/`, `config/`, `database/`, `public/`, `resources/`, `routes/`, `storage/`, `tests/`, `e2e/`, `scripts/`, `tools/`, `vendor/`, `node_modules/`, `composer.json`, `composer.lock`, `package.json`, `package-lock.json`, `artisan`, configs root asociadas)
  - eliminacion de `next-stack/legacy-support/`
  - `nico-dev.bat`
  - `README.md`
  - `.github/workflows/ci.yml`
  - `.gitignore`
  - `next-stack/apps/api/package.json`
  - `project-docs/*` relevantes al retiro del legacy
- ¿Cambio comportamiento funcional?: No del producto. Si del repositorio y tooling: el stack operativo queda solo en `next-stack/`.
- Validaciones ejecutadas:
  - `npm run env:check`
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
- Riesgos / notas:
  - el unico material root restante es documental/historico
  - el siguiente paso ya no es tecnico, sino decidir si se conserva o reduce aun mas el material historico de raiz

### 2026-03-09 - Codex
- Alcance: Fase Final de cierre de migracion para consolidar documentacion, retirar historicos narrativos redundantes y declarar el repo cerrado sobre el nuevo stack.
- Tipo de intervencion: consolidacion documental final + limpieza de historicos.
- Archivos tocados:
  - `project-docs/MIGRATION_CLOSURE.md`
  - `project-docs/MIGRATION_STATUS.md`
  - `project-docs/PROJECT_CONTEXT.md`
  - `project-docs/REPO_MAP.md`
  - `project-docs/WORKFLOW_AI.md`
  - `project-docs/CANONICAL_SOURCES.md`
  - `project-docs/DECISIONS_LOG.md`
  - `README.md`
  - `AGENTS.md`
  - `next-stack/docs/DEPLOY_VPS_UBUNTU.md`
  - historicos documentales retirados de la raiz
- ¿Cambio comportamiento funcional?: No del producto. Si del repositorio: cierre formal de migracion y reduccion de ruido documental.
- Validaciones ejecutadas:
  - `npm run env:check`
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
  - `npm run qa:legacy:detach`
- Riesgos / notas:
  - `project-docs/` queda como unica documentacion viva.
  - `next-stack/docs/` queda como capa de runbooks operativos del stack actual.
