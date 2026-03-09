# PARITY_STRATEGY

## Validaciones canonicas actuales

- `npm run env:check`
- `npm run typecheck --workspace @nico/api`
- `npm run typecheck --workspace @nico/web`
- `npm run build --workspace @nico/api`
- `npm run build --workspace @nico/web`
- `npm run smoke:backend`
- `npm run smoke:web`
- `npm run qa:route-parity`
- checks complementarios del nuevo stack cuando corresponda (`qa:frontend:e2e`, `qa:admin:visual`, `qa:responsive:visual`, `qa:legacy:detach`)

## Estado de parity legacy

- `qa:visual-parity`: retirado
- tooling asociado: retirado
- justificacion: el gate moderno del nuevo stack ya cubre sanidad estructural y funcional minima sin depender del root legacy
