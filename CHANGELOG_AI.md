# Bitácora de cambios asistidos por IA

## Formato sugerido

### YYYY-MM-DD - Actor/Agente
- Alcance:
- Tipo de intervención:
- Archivos tocados:
- ¿Cambió comportamiento funcional?: Sí/No
- Validaciones ejecutadas:
- Riesgos / notas:

---

### 2026-03-06 - Codex
- Alcance: auditoría técnica inicial del repositorio y creación de base documental persistente.
- Tipo de intervención: documentación y gobernanza, sin cambios funcionales.
- Archivos tocados:
  - `project-docs/PROJECT_CONTEXT.md`
  - `project-docs/ARCHITECTURE.md`
  - `project-docs/REPO_MAP.md`
  - `project-docs/FRONTEND_MAP.md`
  - `project-docs/BACKEND_MAP.md`
  - `project-docs/BUSINESS_RULES.md`
  - `project-docs/MIGRATION_STATUS.md`
  - `project-docs/CLEANUP_CANDIDATES.md`
  - `project-docs/WORKFLOW_AI.md`
  - `project-docs/OPEN_QUESTIONS.md`
  - `project-docs/DECISIONS_LOG.md`
  - `AGENTS.md`
  - `CHANGELOG_AI.md`
- ¿Cambió comportamiento funcional?: No.
- Validaciones ejecutadas:
  - inspección estructural del repo
  - contraste contra `docs/CONOCIMIENTO_COMPLETO_NICOREPARACIONES.txt`
  - revisión de router frontend, módulos backend, schema Prisma, scripts QA y documentos operativos
- Riesgos / notas:
  - la documentación creada refleja el estado confirmado por código al momento de la auditoría.
  - varios puntos quedaron marcados como `pendiente de validación` antes de cualquier cleanup profundo.

### 2026-03-06 - Codex
- Alcance: fase 2 de auditoría técnica y canonización para preparar cleanup seguro.
- Tipo de intervención: documentación y clasificación de riesgo, sin cambios funcionales.
- Archivos tocados:
  - `project-docs/CANONICAL_SOURCES.md`
  - `project-docs/CLEANUP_EXECUTION_PLAN.md`
  - `project-docs/OPEN_QUESTIONS.md`
  - `project-docs/DECISIONS_LOG.md`
  - `AGENTS.md`
  - `CHANGELOG_AI.md`
- ¿Cambió comportamiento funcional?: No.
- Validaciones ejecutadas:
  - inventario y comparación de assets duplicados entre `public/` root y `next-stack/apps/web/public`
  - revisión de `.env`, `.env.example`, loaders y scripts Prisma/QA
  - revisión de scripts `migrate-legacy-*`, `qa-visual-parity.mjs`, `qa-route-parity.mjs`
  - revisión del router real del frontend y uso aparente de aliases legacy
  - revisión del uso real de `@nico/contracts`
- Riesgos / notas:
  - quedaron definidas fuentes canónicas recomendadas y riesgo de cleanup por categorías.
  - el root legacy sigue siendo soporte histórico sensible y no debe limpiarse sin aprobación humana explícita.

### 2026-03-06 - Codex
- Alcance: fase 3 de cleanup controlado del repo.
- Tipo de intervención: cleanup low-risk / medium-risk con normalización de entorno y documentación.
- Archivos tocados:
  - `next-stack/apps/api/src/load-canonical-env.ts`
  - `next-stack/apps/api/src/main.ts`
  - `next-stack/apps/api/src/modules/app.module.ts`
  - `next-stack/apps/api/prisma/db-check.ts`
  - `next-stack/apps/api/prisma/fix-mojibake.ts`
  - `next-stack/apps/api/prisma/migrate-legacy-settings.ts`
  - `next-stack/apps/api/prisma/migrate-legacy-product-images.ts`
  - `next-stack/apps/api/prisma/migrate-legacy-visual-assets.ts`
  - `next-stack/apps/api/prisma/seed.ts`
  - `next-stack/apps/api/package.json`
  - `next-stack/apps/web/vite.config.ts`
  - `next-stack/scripts/env-check.mjs`
  - `project-docs/CLEANUP_CANDIDATES.md`
  - `project-docs/CLEANUP_EXECUTION_PLAN.md`
  - `project-docs/CANONICAL_SOURCES.md`
  - `project-docs/DECISIONS_LOG.md`
  - `project-docs/OPEN_QUESTIONS.md`
  - `AGENTS.md`
  - `CHANGELOG_AI.md`
- Archivos eliminados:
  - `npm`
  - `tmp_evophone_product.html`
  - `next-stack/apps/api/.env`
  - `next-stack/apps/web/public/manifest.webmanifest`
  - `next-stack/apps/web/src/features/admin/AdminSettingsPage.tsx`
  - `next-stack/apps/web/src/features/repairs/AdminRepairsPage.tsx`
  - `next-stack/apps/web/src/features/auth/AuthStatusCard.tsx`
  - artefactos locales regenerables: `playwright-report/`, `test-results/`, `next-stack/artifacts/`, `next-stack/.qa-*.log`, `next-stack/api-dev.log`, `.qa_api_pid`, `.phpunit.result.cache`
- ¿Cambió comportamiento funcional?: No en negocio; sí se consolidó la carga de entorno hacia `next-stack/.env` y se eliminó ruido no operativo.
- Validaciones ejecutadas:
  - búsquedas globales `rg` sobre cada candidato eliminado
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
- Riesgos / notas:
  - `next-stack/.dev-logs/` no pudo purgarse por locks de archivos abiertos por procesos locales (`api.log`, `web.log`).
  - no se tocaron scripts high-risk, aliases legacy, assets duplicados del root ni el Laravel legacy.
