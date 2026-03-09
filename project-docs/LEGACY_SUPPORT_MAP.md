# LEGACY_SUPPORT_MAP

## Objetivo

Mapear las piezas legacy que siguen existiendo y distinguir claramente entre soporte transitorio activo y tooling ya deprecado.

## 1. Estructura actual

Ubicacion:

- `next-stack/legacy-support/`

Categorias vigentes:

- `assets/`: compatibilidad canon -> root legacy
- `deprecated/`: tooling legacy fuera del flujo normal

## 2. Soporte transitorio que sigue vivo

### `next-stack/legacy-support/assets/sync-canonical-assets-to-legacy-root.mjs`
- Tipo: compatibilidad transitoria de assets.
- Rol: espejar el set canonico `next-stack/apps/web/public` hacia `public/` root mientras exista el runtime legacy.
- Dependencia del root Laravel: si, como runtime mirror.
- Riesgo: medio/alto.

## 3. Tooling legacy deprecado

### `next-stack/legacy-support/deprecated/qa/qa-visual-parity.mjs`
- Estado: deprecated.
- Rol historico: comparar capturas legacy vs next.
- Motivo de deprecacion: costo alto, dependencia fuerte del root Laravel y cobertura reducida respecto del gate actual.
- Riesgo: alto si se reactiva sin justificar.

### `next-stack/legacy-support/deprecated/sqlite/legacy-visual-parity.sqlite`
- Estado: deprecated.
- Rol historico: fallback SQLite para la parity visual legacy.
- Motivo de deprecacion: queda atado a la herramienta archivada.
- Riesgo: medio/bajo mientras solo permanezca archivado.

### `next-stack/legacy-support/deprecated/api/migrate-legacy-settings.ts`
- Estado: deprecated.
- Rol historico: migracion puntual de settings desde legacy.
- Evidencia reciente: dry-run sin datos pendientes.
- Riesgo: medio si se elimina sin un ultimo sign-off humano; bajo como archivado.

### `next-stack/legacy-support/deprecated/api/migrate-legacy-product-images.ts`
- Estado: deprecated.
- Rol historico: rescate de imagenes legacy.
- Evidencia reciente: dry-run sin copias necesarias; fallback root/storage ya sin contenido vivo relevante.
- Riesgo: medio.

### `next-stack/legacy-support/deprecated/api/migrate-legacy-visual-assets.ts`
- Estado: deprecated.
- Rol historico: consolidacion de branding/assets desde legacy.
- Evidencia reciente: el canon ya vive en `apps/web/public`; dry-run sin copias reales necesarias.
- Riesgo: medio.

## 4. Dependencias con el root Laravel

### Siguen dependiendo del root o de su runtime mirror
- `next-stack/legacy-support/assets/sync-canonical-assets-to-legacy-root.mjs`
- `public/` root mientras siga existiendo el runtime legacy

### Quedaron solo como tooling archivado
- `next-stack/legacy-support/deprecated/qa/qa-visual-parity.mjs`
- `next-stack/legacy-support/deprecated/sqlite/legacy-visual-parity.sqlite`
- `next-stack/legacy-support/deprecated/api/*`

## 5. Regla operativa

- No usar `legacy-support/deprecated/` como parte del flujo normal.
- Si una tarea necesita tocar esta capa, registrar motivo y alcance en `project-docs/DECISIONS_LOG.md` y `CHANGELOG_AI.md`.
- El siguiente retiro fuerte del legado debe empezar por esta carpeta deprecated y por el runtime legacy que todavia le da contexto.
