# CLEANUP_EXECUTION_PLAN

## Objetivo

Preparar y registrar una limpieza segura, trazable y escalonada.

## Reglas de ejecución

- No eliminar nada sin registrar el cambio en `CHANGELOG_AI.md`.
- Toda limpieza que toque canon, legado o QA debe dejar evidencia en `project-docs/DECISIONS_LOG.md`.
- Todo bloque debe partir con baseline tecnico:
  - `npm run env:check`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`

## Estado despues de Fase 4F

- `qa:visual-parity` ya no es gate canonico.
- los migradores legacy ya no forman parte del flujo normal.
- el soporte legacy activo real se reduce a compatibilidad de assets y a la existencia del root Laravel historico.

## Clasificacion de riesgo

### Bajo riesgo
- artefactos regenerables
- logs locales
- caches del root legacy
- ajustes documentales

### Medio riesgo
- retiro de `next-stack/legacy-support/deprecated/api/*`
- retiro de `next-stack/legacy-support/deprecated/sqlite/legacy-visual-parity.sqlite`
- retiro de `storage/app/public` y `public/storage` si siguen vacios
- consolidacion documental entre `docs/`, `next-stack/docs/` y `project-docs/`

### Alto riesgo
- retiro de duplicados en `public/` root
- retiro del runtime Laravel root
- cleanup Composer del root legacy
- limpieza de residuos de esquema legacy
- retiro de aliases legacy del router

## Orden recomendado de ejecucion

### Bloque siguiente recomendado
1. retirar `legacy-support/deprecated/`
2. retirar duplicados en `public/` root
3. auditar composer/runtime residual del root
4. definir retiro final del root Laravel

## Que puede hacerse sin aprobacion explicita

- limpiar artefactos regenerables
- actualizar documentacion
- retirar tooling legacy ya formalmente deprecado solo si la evidencia de no uso sigue siendo clara

## Que requiere aprobacion humana explicita

- cualquier borrado en `public/` root
- cualquier accion sobre el root Laravel o sus dependencias Composer
- retiro de aliases legacy
- limpieza de esquema legacy

## Gate operativo vigente

Antes de cualquier fase high-risk, mantener en verde:

- `npm run env:check`
- `npm run typecheck --workspace @nico/api`
- `npm run typecheck --workspace @nico/web`
- `npm run build --workspace @nico/api`
- `npm run build --workspace @nico/web`
- `npm run smoke:backend`
- `npm run smoke:web`
- `npm run qa:route-parity`

## Nota sobre parity legacy

- `legacy:parity:deprecated` queda solo como herramienta manual/historica.
- No forma parte del gate ni debe usarse como criterio principal de salud del repo.
