# WORKFLOW_AI

## Objetivo

Definir una metodologia unica y repetible para que Codex trabaje sobre el repo con foco en simplicidad, orden, validacion por impacto y documentacion util.

## Invariantes del repo

- Tomar `project-docs/` como fuente viva de contexto.
- Tocar codigo operativo solo dentro de `next-stack/`.
- Tratar `next-stack/docs/` como runbooks operativos.
- No reintroducir runtime o soporte legacy.
- No crear nuevas fuentes de verdad para assets, env o documentacion.

## Flujo operativo obligatorio

### 1. Clasificar la tarea

- Identificar si es bugfix, feature, refactor, limpieza, documentacion o investigacion.
- Definir criterio de exito antes de tocar codigo.
- Delimitar que queda dentro y fuera de alcance.

### 2. Explorar primero

- Leer codigo y docs relevantes antes de proponer cambios.
- Confirmar entradas reales, dependencias y puntos de impacto.
- Validar referencias antes de simplificar, mover o eliminar.

### 3. Preguntar con intencion

- Hacer preguntas solo si queda ambiguedad material de alcance, UX, datos, arquitectura o riesgo.
- No preguntar cosas que puedan resolverse leyendo el repo.
- Si la ambiguedad es menor y reversible, elegir el default mas seguro y declararlo.

### 4. Explicar enfoque y tradeoffs

- Antes de cambios relevantes, resumir:
  - riesgos principales
  - ventajas de la solucion propuesta
  - desventajas o costos
  - criterio para elegir ese enfoque sobre alternativas

### 5. Ordenar antes o junto con la implementacion

- Priorizar codigo simple, ordenado y facil de mantener.
- Si el diseno actual estorba, refactorizar o reestructurar primero dentro del subdominio afectado.
- Evitar parches que agreguen complejidad accidental cuando una limpieza razonable mejora claridad inmediata.

### 6. Implementar en cambios chicos y coherentes

- Mantener cambios acotados por responsabilidad.
- No mezclar limpiezas no relacionadas con la tarea salvo que desbloqueen o reduzcan riesgo claro.
- Evitar duplicacion, nombres ambiguos y helpers sin dueno claro.

### 7. Validar segun impacto

- Ejecutar checks relevantes al cambio antes de cerrar la tarea.
- Analizar errores antes de seguir; no taparlos con mas cambios.
- No asumir que todo requiere QA maxima si el impacto es acotado.

## Politica de validacion por impacto

- Documentacion o gobernanza: revisar consistencia, enlaces y diff final.
- Frontend: `typecheck`, `build`, y `smoke:web` si cambia flujo visible o routing.
- Backend: `typecheck`, `build`, y checks o smokes del dominio afectado si cambia comportamiento.
- Cambios transversales o de estructura: sumar `env:check`, `qa:route-parity` y `qa:legacy:detach` cuando apliquen.
- Si una validacion no puede correrse, dejarlo explicitado con motivo.

## Uso de `nico-dev.bat`

- Usar `nico-dev.bat start` solo cuando aporte validacion manual o visual real.
- No arrancar el stack por reflejo si `typecheck`, `build`, tests o smokes ya cubren el riesgo.
- Priorizar `nico-dev.bat` cuando:
  - el cambio afecta una vista o flujo visible en la web
  - se necesita verificar integracion manual
  - el usuario quiere revisar el resultado en el navegador
- Si no agrega senal, omitirlo y explicar por que.

## Politica documental

- `project-docs/INDEX.md` es el router documental unico.
- `AGENTS.md` contiene reglas cortas y normativas para Codex.
- Este archivo contiene la metodologia detallada.
- `project-docs/DECISIONS_LOG.md` registra decisiones tecnicas.
- `CHANGELOG_AI.md` registra intervenciones asistidas por IA.
- `project-docs/plans/` contiene planes temporales o activos.
- `project-docs/migration-archive/` contiene legado y cierres historicos.

## Cuando documentar

- Cambios de arquitectura o convenciones: actualizar doc de dominio + `DECISIONS_LOG.md`.
- Cambios de implementacion sin cambio conceptual: documentar solo si mejora comprension futura.
- Cambios que alteran el entendimiento del repo: actualizar la documentacion viva en la misma tarea.
- No crear `.md` sueltos fuera de la taxonomia existente salvo justificacion explicita.

## Cierre de tarea

- Reportar exactamente que se toco y por que.
- Dejar validaciones ejecutadas o validaciones omitidas con motivo.
- Registrar decisiones y trazabilidad cuando corresponda.
- Cerrar tareas de codigo con la skill `repo-ship`, salvo que el usuario indique no commitear o no pushear.
- Si la tarea queda parcial o con una fase pendiente, cerrar siempre con el siguiente paso recomendado para completarla y evitar cierres ambiguos.

## Uso recomendado de herramientas

- ChatGPT: estrategia, auditoria, clarificacion, redaccion y planificacion.
- Codex: inspeccion del repo, cambios concretos, validaciones, ejecucion tecnica y cierre operativo.

## Regla final

Todo trabajo nuevo debe asumirse sobre el stack cerrado actual, no sobre una transicion entre stacks.
