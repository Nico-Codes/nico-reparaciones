# WORKFLOW_AI

## Flujo recomendado de trabajo

1. tomar `project-docs/` como fuente viva de contexto
2. tocar codigo operativo solo dentro de `next-stack/`
3. validar referencias antes de simplificar o eliminar
4. registrar decisiones en `project-docs/DECISIONS_LOG.md`
5. registrar cambios asistidos por IA en `CHANGELOG_AI.md`

## Reglas operativas

- no reintroducir runtime o soporte legacy
- no crear nuevas fuentes de verdad para assets, env o documentacion
- no modificar partes sensibles sin dejar validaciones ejecutadas
- si una tarea cambia arquitectura o convenciones, actualizar documentacion en la misma intervención

## Gate canonico minimo

- `env:check`
- `typecheck` api/web
- `build` api/web
- `smoke:backend`
- `smoke:web`
- `qa:route-parity`
- `qa:legacy:detach`

## Uso recomendado de herramientas

- ChatGPT: estrategia, auditoria, clarificacion, redaccion, planificacion
- Codex: inspeccion del repo, cambios concretos, validaciones, ejecucion tecnica

## Regla final

Todo trabajo nuevo debe asumirse sobre el stack cerrado actual, no sobre una transicion entre stacks.
