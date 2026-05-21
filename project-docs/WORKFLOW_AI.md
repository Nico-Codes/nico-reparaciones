# WORKFLOW_AI

## Objetivo

Definir una metodologia unica y repetible para que Codex trabaje sobre el repo con foco en simplicidad, orden, validacion por impacto y documentacion util.

## Modelo de trabajo IA

- ChatGPT analiza, audita, compara alternativas y decide estrategia cuando hay ambiguedad o riesgo.
- Codex inspecciona el repo, ejecuta cambios, automatiza pasos seguros, corre validaciones y deja trazabilidad documental.
- Codex no debe pedir pasos manuales si puede hacerlos de forma segura, reversible y verificable con las herramientas disponibles.
- Usar MCPs disponibles cuando aporten contexto real, acceso a sistemas conectados, validacion o automatizacion concreta.
- Seguridad, performance, orden, mantenibilidad y UI/UX son requisitos de aceptacion, no mejoras opcionales.

## Invariantes del repo

- Tomar `project-docs/` como fuente viva de contexto.
- Tocar codigo operativo solo dentro de `next-stack/`.
- Tratar `next-stack/docs/` como runbooks operativos.
- No reintroducir runtime o soporte legacy.
- No crear nuevas fuentes de verdad para assets, env o documentacion.

## Flujo operativo obligatorio

### 0. Trabajar por etapas

- Dividir trabajos grandes en etapas cerrables con objetivo, alcance, validacion y entregable propio.
- No mezclar decisiones de arquitectura, cambios funcionales, refactors y deploys en una misma etapa salvo que dependan directamente entre si.
- Cada etapa debe dejar claro:
  - que cambia
  - que no cambia
  - como se valida
  - que decision queda pendiente si no se puede cerrar
- Si una etapa revela deuda inmediata dentro del mismo subdominio, Codex puede ordenar esa zona si reduce riesgo y no cambia el alcance funcional acordado.

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
- Si hay varias opciones razonables, dejar una recomendacion priorizada por defecto y justificarla con un criterio corto y operativo.

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

## Cuando abrir un nuevo chat con Codex

- Al empezar una etapa nueva con alcance claro despues de cerrar la anterior.
- Cuando el contexto acumulado sea demasiado largo y ya exista un resumen operativo suficiente.
- Cuando se cambia de subdominio principal, por ejemplo de `repairs` a `catalog-admin` o de backend a deploy.
- Despues de un commit/push aceptado, para que la siguiente tarea parta de un estado limpio.
- Cuando un bloqueo requiere redefinir alcance con ChatGPT y luego volver a ejecucion.

## Cuando volver a ChatGPT

- Cuando falte una decision de producto, UX, datos, arquitectura, seguridad o costo operativo.
- Cuando existan dos o mas rutas razonables con impactos distintos.
- Antes de introducir librerias, servicios externos, cambios de infraestructura o migraciones relevantes.
- Si una validacion muestra un riesgo que cambia el plan original.
- Si Codex detecta mezcla con cambios ajenos y no puede separar la tarea sin decision humana.

## Prompts eficientes para Codex

- Incluir ruta del repo, etapa actual, objetivo, restricciones y lista de tareas verificables.
- Referenciar archivos canonicos por path en vez de pegar documentacion completa cuando el repo ya la contiene.
- Indicar comandos permitidos y prohibidos si hay restricciones de entorno.
- Pedir entregables concretos: archivos a tocar, validaciones esperadas, formato de cierre y si se permite commit.
- Evitar repetir contexto historico que no afecta la etapa actual; basta con decision vigente, rama, estado git y ultima version relevante.
- Si el cambio es visual, incluir criterios UI/UX concretos y pedir validacion con navegador o `nico-dev.bat` solo cuando aporte senal real.

## Formato de respuesta esperado de Codex

- Resumen corto de lo hecho.
- Archivos modificados o creados.
- Comandos ejecutados.
- Resultado de validacion, incluyendo checks omitidos y motivo.
- Riesgos, notas o siguiente paso concreto si no queda cerrado.
- Sugerencia de commit con formato `V1.xxx-DetalleCorto` cuando corresponda, sin commitear si el usuario no lo pidio.

## Formato ANTES/DESPUES

- Usar `ANTES` / `DESPUES` cuando se modifique codigo o documentacion importante y ayude a revisar el cambio sin releer todo el archivo.
- Mantenerlo breve: describir el comportamiento, regla o estructura antes y despues.
- No usarlo para cambios triviales donde agregue ruido.

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
- Si la tarea queda bloqueada por riesgo, falta de contexto o una decision pendiente del usuario, dejar explicitado cual es el bloqueo real y cual es la decision minima que falta para continuar.
- Si quedan varias rutas posibles para seguir, recomendar una como opcion prioritaria y resumir por que es la mejor siguiente accion.

## Uso recomendado de herramientas

- ChatGPT: estrategia, auditoria, clarificacion, redaccion y planificacion.
- Codex: inspeccion del repo, cambios concretos, validaciones, ejecucion tecnica y cierre operativo.

## Regla final

Todo trabajo nuevo debe asumirse sobre el stack cerrado actual, no sobre una transicion entre stacks.
