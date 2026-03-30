# Reglas permanentes para agentes e IA en NicoReparaciones

## Contrato operativo
- Stack operativo unico: `next-stack/`.
- Documentacion viva canonica: `project-docs/`.
- Runbooks tecnicos del stack actual: `next-stack/docs/`.
- No existe runtime legacy dentro del repo operativo.

## Principios no negociables
- Escribir codigo simple, ordenado y consistente con una metodologia de trabajo estable.
- No reintroducir Laravel root, tooling legacy, mirrors de assets ni nuevas fuentes de verdad.
- No introducir librerias nuevas sin justificar necesidad real.
- No dejar codigo comentado, basura historica ni archivos "por si acaso".
- No hacer cambios destructivos sin validar referencias reales.

## Comportamiento por defecto de Codex
- Explorar codigo y documentacion relevante antes de decidir.
- Preguntar solo cuando exista ambiguedad material de alcance, UX, datos, arquitectura o riesgo.
- Exponer riesgos, ventajas, desventajas y enfoque recomendado antes de cambios relevantes.
- Priorizar simplificar, ordenar o reestructurar el subdominio afectado si eso mejora claridad o evita deuda inmediata.
- Validar con checks relevantes al impacto; no asumir QA maxima siempre.
- Usar `nico-dev.bat` solo cuando aporte validacion visual o manual real, especialmente sobre flujos web.

## Gobernanza documental
- Tratar `project-docs/INDEX.md` como router documental unico.
- Tratar `project-docs/WORKFLOW_AI.md` como metodologia operativa detallada.
- Registrar decisiones tecnicas en `project-docs/DECISIONS_LOG.md`.
- Registrar cambios asistidos por IA en `CHANGELOG_AI.md`.
- No crear `.md` sueltos fuera de la taxonomia vigente salvo justificacion explicita.
- Si una intervencion cambia arquitectura, convenciones o entendimiento del repo, actualizar la documentacion viva impactada en la misma tarea.

## Cierre de tareas y versionado
- Al finalizar una tarea con cambios de codigo, usar la skill `repo-ship` ubicada en `C:\Users\nicol\.codex\skills\repo-ship\SKILL.md` para stagear, commitear y pushear el trabajo terminado salvo instruccion contraria del usuario.
- El formato de commit requerido es `V1.xxx-DetalleCorto`, incrementando la ultima version existente.
- Antes de commitear, separar siempre cambios de la tarea actual de cambios previos o ajenos; si hay mezcla o ambiguedad, frenar y consultarlo.
- No agregar scripts, batchs ni comandos dentro del repo solo para automatizar commit/push, salvo pedido expreso del usuario.
- Si una tarea no queda cerrada en su totalidad, terminar la respuesta con el siguiente paso concreto o la recomendacion prioritaria para completarla.
