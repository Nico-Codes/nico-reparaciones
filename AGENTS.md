# Reglas permanentes para agentes e IA en NicoReparaciones

## Estado actual del repo
- Stack operativo unico: `next-stack/`
- Documentacion viva canonica: `project-docs/`
- Runbooks tecnicos del stack actual: `next-stack/docs/`
- No existe runtime legacy dentro del repo operativo.

## Fuentes canonicas obligatorias
- Frontend: `next-stack/apps/web`
- Backend: `next-stack/apps/api`
- Contratos compartidos: `next-stack/packages/contracts`
- Assets visuales: `next-stack/apps/web/public`
- Entorno/configuracion: `next-stack/.env` y `.env*.example` dentro de `next-stack/`
- Documentacion de contexto, arquitectura y decisiones: `project-docs/`

## Reglas criticas
- No reintroducir Laravel root, tooling legacy ni mirrors de assets.
- No hacer cambios destructivos sin validar referencias reales.
- No introducir librerias nuevas sin justificar necesidad real.
- No dejar codigo comentado o basura historica como “por si acaso”.
- Cuando exista ambiguedad de impacto, documentar antes de actuar.

## Mantenimiento del repo
- Tratar `project-docs/` como unica narrativa viva del proyecto.
- Tratar `next-stack/docs/` como runbooks operativos del stack actual.
- Registrar decisiones tecnicas en `project-docs/DECISIONS_LOG.md`.
- Registrar cambios asistidos por IA en `CHANGELOG_AI.md`.
- Si una intervencion cambia el entendimiento del repo, actualizar documentacion en la misma tarea.

## Reporte de cambios
- Al modificar archivos, reportar exactamente que se toco y por que.
- Si se cambia comportamiento funcional, dejar validaciones ejecutadas.
- Si se simplifica estructura del repo, dejar criterio y alcance documentados.
