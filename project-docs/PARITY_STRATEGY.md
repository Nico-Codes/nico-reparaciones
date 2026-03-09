# PARITY_STRATEGY

## Objetivo

Definir que validaciones siguen siendo canonicas hoy y cual es el estado real de la parity legacy.

## Validaciones canonicas actuales

El gate operativo del proyecto nuevo queda compuesto por:

- `npm run env:check`
- `npm run typecheck --workspace @nico/api`
- `npm run typecheck --workspace @nico/web`
- `npm run build --workspace @nico/api`
- `npm run build --workspace @nico/web`
- `npm run smoke:backend`
- `npm run smoke:web`
- `npm run qa:route-parity`
- segun necesidad del bloque: `qa:frontend:e2e`, `qa:admin:visual`, `qa:responsive:visual`, `qa:legacy:detach`

Estas validaciones ya cubren:

- salud de entorno
- compilacion y tipado
- rutas y aliases legacy todavia soportados
- flujos criticos del backend nuevo
- carga basica del frontend nuevo
- auditoria visual del admin y responsive del stack nuevo

## Estado de `qa:visual-parity`

Estado actual: `deprecated / manual historical tool`

Motivos:

- depende de levantar el root Laravel historico
- depende de un SQLite auxiliar legacy
- cubre un subconjunto pequeno de rutas publicas
- su valor hoy se superpone parcialmente con `smoke:web`, `qa:route-parity`, `qa:frontend:e2e`, `qa:admin:visual` y `qa:responsive:visual`
- ya no aporta valor proporcional al costo de mantener vivo el root Laravel solo para esa comparacion

## Decision operativa

- `qa:visual-parity` deja de ser gate canonico.
- la herramienta queda archivada en `next-stack/legacy-support/deprecated/qa/qa-visual-parity.mjs`.
- su SQLite asociada queda archivada en `next-stack/legacy-support/deprecated/sqlite/legacy-visual-parity.sqlite`.
- cualquier uso futuro debe considerarse excepcional y manual.

## Reemplazo practico de su valor

Lo que antes justificaba parity legacy se cubre ahora con una combinacion de:

- `qa:route-parity` para compatibilidad de rutas legacy todavia expuestas
- `smoke:web` para carga base de rutas publicas criticas
- `qa:frontend:e2e` para flujos del nuevo stack
- `qa:admin:visual` para vistas admin relevantes
- `qa:responsive:visual` para estados visuales del frontend nuevo en desktop/tablet/mobile
- revision manual puntual cuando se cambie branding o UI critica

## Politica futura

- No reactivar `qa:visual-parity` como gate salvo que exista una razon documentada y un bloque tecnico concreto que lo justifique.
- Si el root Laravel se retira definitivamente, `deprecated/qa/` y `deprecated/sqlite/` pasan a retiro directo.
