# DECISIONS_LOG

## Proposito

Registrar decisiones tecnicas confirmadas, con contexto y criterio, para evitar que el proyecto dependa de memoria oral.

## Formato recomendado

### [ID]
- Fecha:
- Estado: propuesta | aceptada | descartada | reemplazada
- Tema:
- Contexto:
- Decision:
- Impacto:
- Alternativas consideradas:
- Archivos / modulos afectados:
- Validacion requerida:
- Responsable:

---

## Entradas

### [DL-0001]
- Fecha: 2026-03-06
- Estado: aceptada
- Tema: base documental persistente del repo
- Contexto: el repo ya tenia runbooks operativos y documentacion dispersa, pero no una capa de contexto vivo y gobernanza separada de la operacion.
- Decision: crear `project-docs/` como fuente viva para contexto del proyecto, arquitectura, mapas del repo, estado de migracion, metodologia y candidatos de limpieza.
- Impacto: mejora onboarding, auditoria y futuras intervenciones; no cambia comportamiento funcional de la app.
- Alternativas consideradas: seguir usando solo `docs/` root o `next-stack/docs/`; descartado por mezcla de runbooks operativos con contexto de mantenimiento.
- Archivos / modulos afectados: `project-docs/*`, `AGENTS.md`, `CHANGELOG_AI.md`
- Validacion requerida: no funcional; si documental por parte de los mantenedores.
- Responsable: Codex + operador humano

### [DL-0002]
- Fecha: 2026-03-06
- Estado: aceptada
- Tema: fuente canónica de código operativo
- Contexto: el código real de frontend, backend, QA y cierre de migración está concentrado en `next-stack/`.
- Decision: considerar `next-stack/apps/web`, `next-stack/apps/api` y `next-stack/packages/contracts` como única fuente canónica de código operativo actual.
- Impacto: futuras mejoras y auditorías deben partir del nuevo stack; el root Laravel deja de ser referencia primaria para cambios nuevos.
- Alternativas consideradas: mantener doble canon entre root legacy y `next-stack/`; descartado por ambigüedad operativa.
- Archivos / modulos afectados: `next-stack/**`, `project-docs/CANONICAL_SOURCES.md`
- Validacion requerida: seguimiento humano para que nuevas intervenciones respeten el canon.
- Responsable: Codex + operador humano

### [DL-0003]
- Fecha: 2026-03-06
- Estado: aceptada
- Tema: fuente canónica de assets visuales
- Contexto: el API sirve estáticos desde `apps/web/public`, los uploads/admin escriben allí, y los assets duplicados del root coinciden por hash en branding relevante.
- Decision: declarar `next-stack/apps/web/public` como fuente canónica operativa de assets del nuevo stack. `public/` root queda como espejo histórico/transitorio.
- Impacto: cualquier consolidación futura de assets debe converger hacia `apps/web/public`.
- Alternativas consideradas: dejar `public/` root como canon; descartado porque el runtime nuevo no sirve ni escribe allí como fuente primaria.
- Archivos / modulos afectados: `next-stack/apps/web/public`, `next-stack/apps/api/src/main.ts`, `next-stack/apps/api/src/modules/admin/admin.service.ts`, `next-stack/apps/api/src/modules/catalog-admin/catalog-admin.service.ts`
- Validacion requerida: humana antes de retirar duplicados legacy.
- Responsable: Codex + operador humano

### [DL-0004]
- Fecha: 2026-03-06
- Estado: aceptada
- Tema: fuente canónica de variables de entorno
- Contexto: `env-check.mjs` y scripts Prisma apuntaban a `next-stack/.env`, pero persistía `next-stack/apps/api/.env` como duplicación/fallback.
- Decision: declarar `next-stack/.env` como fuente canónica viva y preparar el retiro de `next-stack/apps/api/.env`.
- Impacto: reduce ambigüedad operativa y simplifica scripts/documentación futura.
- Alternativas consideradas: mantener dos `.env` equivalentes; descartado por riesgo de divergencia silenciosa.
- Archivos / modulos afectados: `next-stack/.env`, `next-stack/.env.example`, `next-stack/.env.production.example`, `next-stack/apps/api/.env`, scripts Prisma y checks.
- Validacion requerida: humana para ejecutar el retiro efectivo.
- Responsable: Codex + operador humano

### [DL-0005]
- Fecha: 2026-03-06
- Estado: aceptada
- Tema: estado de scripts legacy/parity
- Contexto: `migrate-legacy-*` y `qa-visual-parity.mjs` aún tienen referencias funcionales reales y forman parte del soporte histórico del cierre de migración.
- Decision: conservarlos como soporte histórico operativo; no son candidatos de retiro inmediato.
- Impacto: cualquier limpieza de esos scripts pasa a riesgo alto y requiere reemplazo/criterio de retiro explícito.
- Alternativas consideradas: archivarlos ya; descartado por dependencia aún visible de assets, parity y soporte legacy.
- Archivos / modulos afectados: `next-stack/apps/api/prisma/migrate-legacy-*.ts`, `next-stack/scripts/qa-visual-parity.mjs`
- Validacion requerida: humana obligatoria antes de mover o eliminar.
- Responsable: Codex + operador humano

### [DL-0006]
- Fecha: 2026-03-06
- Estado: propuesta
- Tema: rol futuro del root legacy
- Contexto: el root Laravel ya no es la fuente operativa principal, pero todavía aporta parity visual, referencia histórica, documentación y soporte transitorio.
- Decision: recomendar mantener la raíz legacy como histórico activo de soporte en el corto plazo, con objetivo de cuarentena o retiro gradual solo después de deploy productivo, retiro de parity activa y consolidación de assets/env.
- Impacto: evita limpieza prematura de una capa todavía sensible.
- Alternativas consideradas: retiro inmediato o convivencia indefinida sin política; ambas descartadas como estrategia principal.
- Archivos / modulos afectados: raíz Laravel completa (`app/`, `resources/`, `routes/`, `config/`, `database/`, `public/`, `storage/`, `bootstrap/`)
- Validacion requerida: humana obligatoria.
- Responsable: Codex + operador humano

### [DL-0007]
- Fecha: 2026-03-06
- Estado: aceptada
- Tema: alcance actual de `@nico/contracts`
- Contexto: el paquete existe y hoy cubre contratos de `health` y `auth`; su uso real confirmado está concentrado en el backend/auth y no en todo el dominio.
- Decision: mantener `@nico/contracts` mínimo por ahora y expandirlo solo cuando haya necesidad real de contratos compartidos frontend/backend adicionales.
- Impacto: evita sobreingeniería prematura y documenta que hoy no es una capa completa de dominio compartido.
- Alternativas consideradas: expandirlo ya a todo el dominio; descartado por falta de adopción real actual en frontend y módulos no-auth.
- Archivos / modulos afectados: `next-stack/packages/contracts/src/index.ts`, `next-stack/apps/api/src/modules/auth/*`
- Validacion requerida: revisión futura si se comparte más lógica tipada entre apps.
- Responsable: Codex + operador humano

### [DL-0008]
- Fecha: 2026-03-06
- Estado: aceptada
- Tema: consolidación efectiva del entorno canónico
- Contexto: el repo ya tenía `next-stack/.env` como canon recomendado, pero persistía `next-stack/apps/api/.env` y el runtime no estaba blindado explícitamente contra esa duplicación.
- Decision: cargar siempre variables desde `next-stack/.env`, alinear backend y frontend a esa fuente, y retirar `next-stack/apps/api/.env`.
- Impacto: desaparece la ambigüedad de entorno entre API, scripts Prisma y Vite.
- Alternativas consideradas: conservar `apps/api/.env` como fallback; descartado por deuda operativa innecesaria en desarrollo.
- Archivos / modulos afectados: `next-stack/apps/api/src/load-canonical-env.ts`, `next-stack/apps/api/src/main.ts`, `next-stack/apps/api/src/modules/app.module.ts`, `next-stack/apps/api/prisma/*.ts`, `next-stack/apps/web/vite.config.ts`, `next-stack/apps/api/package.json`
- Validacion requerida: `typecheck` de `@nico/api` y `@nico/web`, `env:check`.
- Responsable: Codex + operador humano

### [DL-0009]
- Fecha: 2026-03-06
- Estado: aceptada
- Tema: cleanup controlado low-risk / medium-risk
- Contexto: había artefactos regenerables, archivos temporales y componentes sin referencias estáticas confirmadas que ya no aportaban valor al repo.
- Decision: eliminar `npm`, `tmp_evophone_product.html`, `next-stack/apps/web/public/manifest.webmanifest`, los tres componentes frontend sin referencias y la mayoría de artefactos regenerables de QA/logging.
- Impacto: repo más simple, menos ruido documental y menos deuda de mantenimiento.
- Alternativas consideradas: conservar todo hasta una fase posterior; descartado porque la evidencia de seguridad era suficiente y el entorno sigue en desarrollo.
- Archivos / modulos afectados: raíz del repo, `next-stack/apps/web/public`, `next-stack/apps/web/src/features/*`, artefactos locales de QA y logs
- Validacion requerida: búsquedas `rg`, `typecheck`, `env:check`.
- Responsable: Codex + operador humano
