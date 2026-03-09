# DECISIONS_LOG

## Proposito

Registrar decisiones tecnicas confirmadas para evitar dependencia de memoria oral.

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

### [DL-0023]
- Fecha: 2026-03-09
- Estado: aceptada
- Tema: fundación visual reusable y separación de contexto en frontend
- Contexto: el frontend ya tenía una dirección visual canónica definida, pero seguía mezclando wrappers de tienda con vistas admin y cuenta, usando badges inconsistentes y muy baja adopción del componente `Button`.
- Decisión: consolidar una base reusable en `next-stack/apps/web` con `PageShell`, `PageHeader`, `SectionCard`, `StatusBadge`, `EmptyState`, `LoadingBlock`, `TextField` y `FilterBar`; además, hacer que `AppShell` distinga contexto visual `admin | store | account` y aplicar la base en un conjunto pequeño de vistas representativas.
- Impacto: reduce deuda visual, habilita adopción incremental del sistema y evita seguir resolviendo UI pantalla por pantalla con patrones distintos.
- Alternativas consideradas: seguir mejorando vistas aisladas con clases locales; descartado por mantener inconsistencia y ruido visual.
- Archivos / modulos afectados: `next-stack/apps/web/src/styles.css`, `next-stack/apps/web/src/components/ui/*`, `next-stack/apps/web/src/layouts/AppShell.tsx`, `AdminDashboardPage`, `AdminSettingsHubPage`, `StorePage`, `MyAccountPage`, `MyOrdersPage`.
- Validacion requerida: `env:check`, typecheck, build, smoke y revisión visual incremental en las vistas adoptadas.
- Responsable: Codex + operador humano

### [DL-0022]
- Fecha: 2026-03-09
- Estado: aceptada
- Tema: direccion visual canonica del producto
- Contexto: el frontend operativo ya estaba funcional, pero con mezcla de patrones entre admin, tienda y cuenta, baja adopcion de componentes base y ausencia de un design system real.
- Decision: fijar una direccion visual unica basada en `Clean SaaS / Admin claro` para admin, `Clean eCommerce minimal` para tienda y una capa intermedia para cuenta usuario, documentada en `project-docs/UI_STYLE_GUIDE.md`, `project-docs/DESIGN_SYSTEM.md` y `project-docs/UI_APPLICATION_PLAN.md`.
- Impacto: establece una fuente de verdad para futuras mejoras frontend, evita rehacer pantallas sin criterio compartido y reduce el riesgo de volver al caos visual.
- Alternativas consideradas: seguir mejorando pantalla por pantalla sin guia canonica; descartado por alta probabilidad de inconsistencia y deuda visual.
- Archivos / modulos afectados: `project-docs/UI_STYLE_GUIDE.md`, `project-docs/DESIGN_SYSTEM.md`, `project-docs/UI_APPLICATION_PLAN.md`
- Validacion requerida: revision visual/tactica del operador humano y posterior implementacion incremental con build/typecheck/smoke.
- Responsable: Codex + operador humano

### [DL-0018]
- Fecha: 2026-03-09
- Estado: aceptada
- Tema: parity visual legacy fuera del gate principal
- Contexto: `qa:visual-parity` seguia dependiendo del root Laravel y de un SQLite auxiliar, pero el proyecto ya cuenta con un gate moderno suficiente (`env:check`, typecheck, build, smoke, route parity y checks visuales del nuevo stack).
- Decision: reclasificar `qa:visual-parity` como herramienta deprecated/manual y retirarla del flujo normal y del gate principal.
- Impacto: reduce complejidad, desacopla el mantenimiento diario del root Laravel y aclara que la salud del proyecto se mide desde el stack nuevo.
- Alternativas consideradas: mantenerla como gate o como chequeo rutinario; descartado por costo alto y cobertura redundante.
- Archivos / modulos afectados: `next-stack/package.json`, `next-stack/legacy-support/deprecated/qa/qa-visual-parity.mjs`, `next-stack/docs/*`, `project-docs/PARITY_STRATEGY.md`
- Validacion requerida: gate operativo del nuevo stack.
- Responsable: Codex + operador humano

### [DL-0019]
- Fecha: 2026-03-09
- Estado: aceptada
- Tema: migradores legacy archivados
- Contexto: los dry-run recientes mostraron que settings, product-images y visual-assets legacy ya no aportan cambios reales al stack nuevo.
- Decision: mover `migrate-legacy-settings.ts`, `migrate-legacy-product-images.ts` y `migrate-legacy-visual-assets.ts` a `next-stack/legacy-support/deprecated/api/` y sacarlos del flujo normal.
- Impacto: el stack operativo queda mas claro y el soporte legacy deja de parecer tooling diario.
- Alternativas consideradas: eliminarlos ya; descartado por mantener un ultimo margen de rescate/manualidad mientras se cierra el retiro del root.
- Archivos / modulos afectados: `next-stack/apps/api/package.json`, `next-stack/package.json`, `next-stack/legacy-support/deprecated/api/*`, `project-docs/LEGACY_SUPPORT_MAP.md`
- Validacion requerida: typecheck/build/smokes/route parity.
- Responsable: Codex + operador humano

### [DL-0020]
- Fecha: 2026-03-09
- Estado: aceptada
- Tema: retiro material del root Laravel y del soporte legacy
- Contexto: tras retirar auth social, parity legacy y migradores del flujo normal, el repo ya no tenia dependencia tecnica real del runtime Laravel ni de `next-stack/legacy-support/`.
- Decision: eliminar el runtime Laravel root, eliminar `next-stack/legacy-support/`, reescribir `nico-dev.bat`, `README.md` y CI hacia `next-stack/` y tratar la raiz restante solo como meta-repo + documentacion.
- Impacto: el repositorio queda alineado con una sola arquitectura operativa y deja de mezclar stacks, mirrors y tooling historico.
- Alternativas consideradas: conservar el root como historico activo; descartado por complejidad innecesaria y por ir contra la estrategia de eliminacion total del legacy.
- Archivos / modulos afectados: runtime Laravel root, `next-stack/legacy-support/`, `.github/workflows/ci.yml`, `nico-dev.bat`, `README.md`, `project-docs/*`.
- Validacion requerida: gate operativo del nuevo stack.
- Responsable: Codex + operador humano

### [DL-0021]
- Fecha: 2026-03-09
- Estado: aceptada
- Tema: cierre oficial de migracion y consolidacion documental final
- Contexto: el stack nuevo ya habia reemplazado completamente al legacy y el repo quedo sin runtime Laravel ni tooling heredado activo.
- Decision: declarar oficialmente cerrada la migracion, consolidar `project-docs/` como unica documentacion viva, mantener `next-stack/docs/` como runbooks del stack actual y retirar historicos narrativos redundantes del repo.
- Impacto: elimina ambiguedad sobre el estado del proyecto y deja un repositorio coherente para desarrollo normal sobre el nuevo stack.
- Alternativas consideradas: conservar documentos historicos narrativos dentro del repo; descartado por duplicacion y ruido documental.
- Archivos / modulos afectados: `project-docs/MIGRATION_CLOSURE.md`, `project-docs/MIGRATION_STATUS.md`, `README.md`, `AGENTS.md`, `CHANGELOG_AI.md`, historicos documentales retirados.
- Validacion requerida: gate canonico del nuevo stack.
- Responsable: Codex + operador humano
