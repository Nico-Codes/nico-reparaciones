# WORKFLOW_AI

## Flujo recomendado

1. tomar `project-docs/` como fuente viva
2. tocar codigo operativo solo dentro de `next-stack/`
3. validar referencias antes de borrar o simplificar
4. registrar decisiones en `project-docs/DECISIONS_LOG.md`
5. registrar cambios asistidos por IA en `CHANGELOG_AI.md`

## Regla de oro

No reintroducir runtime o soporte legacy dentro del repo.

## Gates canonicos

- `env:check`
- typecheck api/web
- build api/web
- `smoke:backend`
- `smoke:web`
- `qa:route-parity`

## Cuando hacer cambios grandes

- primero documentar el criterio
- luego aplicar el cambio
- al final correr el gate del nuevo stack
