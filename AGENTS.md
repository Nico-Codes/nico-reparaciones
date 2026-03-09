# Reglas permanentes para agentes e IA en NicoReparaciones

## Alcance general
- Este repositorio contiene tres categorias:
  - `canonico operativo`: `next-stack/`
  - `legacy support transitorio`: `next-stack/legacy-support/assets/`
  - `legacy support deprecated`: `next-stack/legacy-support/deprecated/`
  - `historico / soporte sensible`: raiz Laravel
- Antes de tocar codigo, assets o tooling, identificar en que categoria cae cada archivo.

## Fuentes canonicas obligatorias
- Codigo operativo canonico:
  - `next-stack/apps/web`
  - `next-stack/apps/api`
  - `next-stack/packages/contracts`
- Assets visuales canonicos: `next-stack/apps/web/public`
- Entorno/configuracion canonica: `next-stack/.env` y sus `.env*.example`
- Documentacion viva canonica: `project-docs/`
- Runbooks operativos del nuevo stack: `next-stack/docs/`

## Legacy support
- `next-stack/legacy-support/assets/` contiene solo compatibilidad transitoria canon -> root legacy.
- `next-stack/legacy-support/deprecated/` contiene tooling archivado:
  - parity visual legacy
  - SQLite de parity legacy
  - migradores legacy
- No reintroducir estas piezas deprecated al flujo operativo normal.
- Cualquier uso manual de `legacy-support/deprecated/` debe quedar registrado en `project-docs/DECISIONS_LOG.md` y `CHANGELOG_AI.md`.

## Root Laravel historico
- Antes de tocar la raiz Laravel, revisar:
  - `project-docs/ROOT_LEGACY_POLICY.md`
  - `project-docs/ROOT_LEGACY_RETIREMENT_CHECKLIST.md`
- No tratar `public/` root como fuente primaria de assets.
- No tratar `storage/`, `bootstrap/cache/` o `vendor/` como una sola categoria: hay mezcla de runtime legacy, historico y artefactos regenerables.

## Reglas criticas
- No hacer cambios destructivos sin validar referencias reales.
- No borrar piezas del root, aliases legacy, duplicados root o residuos de esquema sin decision humana explicita.
- No usar tooling deprecated como argumento para mantener vivo el legacy “por si acaso”. Si algo se quiere conservar, debe quedar justificado documentalmente.
- El gate canonico del proyecto es el del nuevo stack; `legacy:parity:deprecated` no forma parte del baseline.

## Registro y trazabilidad
- Registrar decisiones tecnicas en `project-docs/DECISIONS_LOG.md`.
- Registrar cambios asistidos por IA en `CHANGELOG_AI.md`.
- Si una intervencion altera el entendimiento del repo, actualizar la documentacion viva correspondiente.
