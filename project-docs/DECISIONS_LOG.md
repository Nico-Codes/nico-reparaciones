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
