# Reglas permanentes para agentes e IA en NicoReparaciones

## Estado actual del repo
- Codigo operativo canonico: `next-stack/`
- Documentacion viva canonica: `project-docs/`
- Runbooks del stack actual: `next-stack/docs/`
- Material historico no operativo: `docs/` root y PDFs historicos de la raiz
- El runtime Laravel legacy fue retirado materialmente y no debe reintroducirse.

## Fuentes canonicas obligatorias
- Frontend: `next-stack/apps/web`
- Backend: `next-stack/apps/api`
- Contratos compartidos: `next-stack/packages/contracts`
- Assets visuales: `next-stack/apps/web/public`
- Entorno/configuracion: `next-stack/.env` y sus `.env*.example`

## Reglas criticas
- No hacer cambios destructivos sin validar referencias reales.
- No recrear tooling legacy, mirrors root ni compat layers sin una decision tecnica registrada.
- No introducir librerias nuevas sin justificar necesidad real.
- No dejar codigo comentado o basura historica como “por si acaso”.
- Cuando exista ambiguedad sobre impacto, parar y documentar antes de tocar.

## Limpieza y retiro
- Cualquier cleanup debe clasificarse primero por riesgo.
- Si una pieza parece historica pero no esta claro su uso, documentarla antes de eliminarla.
- Registrar decisiones tecnicas en `project-docs/DECISIONS_LOG.md`.
- Registrar cambios asistidos por IA en `CHANGELOG_AI.md`.

## Reporte de cambios
- Al modificar archivos, reportar exactamente que se toco y por que.
- Si una intervencion altera el entendimiento del repo, actualizar la documentacion viva correspondiente.
