# MIGRATION_STATUS

## Estado actual

- `next-stack/` es el stack operativo unico del proyecto.
- el runtime Laravel root fue retirado materialmente.
- no existe ya soporte legacy dentro del repo activo.

## Gate operativo

- `env:check`
- typecheck api/web
- build api/web
- `smoke:backend`
- `smoke:web`
- `qa:route-parity`
- checks complementarios del nuevo stack cuando aplique

## Observacion

La migracion ya no es una convivencia entre stacks. El repo fue consolidado alrededor del nuevo stack.
