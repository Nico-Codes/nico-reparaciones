# WORKFLOW_AI

## Objetivo

Definir una metodologia estable entre humano, ChatGPT y Codex para mantener y evolucionar este repo sin perder control tecnico.

## Principio general

La secuencia recomendada es:

1. entender
2. mapear
3. documentar
4. proponer
5. ejecutar cambios chicos y verificables
6. registrar decisiones

## Gate operativo vigente

El baseline canonico para validar el proyecto nuevo es:

- `npm run env:check`
- `npm run typecheck --workspace @nico/api`
- `npm run typecheck --workspace @nico/web`
- `npm run build --workspace @nico/api`
- `npm run build --workspace @nico/web`
- `npm run smoke:backend`
- `npm run smoke:web`
- `npm run qa:route-parity`

Checks adicionales del nuevo stack segun el bloque:

- `qa:frontend:e2e`
- `qa:admin:visual`
- `qa:responsive:visual`
- `qa:legacy:detach`

## Parity legacy

- `legacy:parity:deprecated` no es gate.
- Solo puede ejecutarse como herramienta manual/historica con una razon documentada.
- No debe reintroducirse en el flujo normal salvo decision tecnica registrada.

## Legacy support

- `next-stack/legacy-support/assets/` = compatibilidad transitoria activa.
- `next-stack/legacy-support/deprecated/` = tooling archivado, fuera del flujo normal.

## Regla para cambios high-risk

Antes de tocar root Laravel, duplicados del root, Composer legacy o residuos de esquema:

- actualizar `project-docs/`
- registrar decision en `project-docs/DECISIONS_LOG.md`
- registrar intervencion en `CHANGELOG_AI.md`
- correr el gate operativo vigente
