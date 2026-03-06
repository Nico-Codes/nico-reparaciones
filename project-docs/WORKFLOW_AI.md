# WORKFLOW_AI

## Objetivo

Definir una metodologia de trabajo estable entre humano, ChatGPT y Codex para mantener y evolucionar este repo sin perder control tecnico.

## Principio general

En este proyecto se debe documentar antes de intervenir agresivamente.

La secuencia recomendada es:

1. entender
2. mapear
3. documentar
4. proponer
5. ejecutar cambios chicos y verificables
6. registrar decisiones

## Cuando usar ChatGPT

Usar ChatGPT para:

- analisis de contexto amplio
- redactar informes, criterios, planes y decisiones
- discutir opciones de arquitectura
- definir metodologia de trabajo
- revisar consistencia conceptual entre modulos
- preparar listas de preguntas abiertas y debt registers

No usar ChatGPT como unica fuente para asumir que algo existe en el codigo. Siempre debe contrastarse con el repo real.

## Cuando usar Codex

Usar Codex para:

- inspeccionar el repo real
- buscar referencias concretas
- editar archivos del proyecto
- crear documentacion persistente
- aplicar cambios tecnicos verificables
- correr comandos, builds y checks locales
- preparar cleanup candidates basados en codigo real

## Como trabajar partes sensibles

Antes de tocar partes sensibles se debe:

- identificar archivos y modulos afectados
- documentar dependencia cruzada
- registrar si hay riesgo para legacy, QA o datos
- dejar una hipotesis de cambio y su plan de validacion

Partes sensibles confirmadas hoy:

- `next-stack/apps/api/src/modules/admin/admin.service.ts`
- `next-stack/apps/api/prisma/schema.prisma`
- `next-stack/apps/web/src/App.tsx`
- `next-stack/apps/web/src/layouts/AppShell.tsx`
- scripts `migrate-legacy-*`
- assets duplicados entre `public/` root y `apps/web/public/`

## Como manejar cambios grandes

Para cambios grandes:

1. abrir rama dedicada
2. actualizar `project-docs/` si cambia contexto
3. registrar decision en `project-docs/DECISIONS_LOG.md`
4. registrar intervencion en `CHANGELOG_AI.md`
5. dividir el trabajo por bloques pequenos
6. validar con QA local al cierre de cada bloque

## Como pedir validacion antes de borrar o refactorizar

Siempre pedir validacion humana cuando ocurra alguno de estos casos:

- hay duda sobre si algo sigue vivo
- el elemento esta en legacy pero todavia lo usan scripts de soporte
- hay riesgo de romper assets o branding
- el cambio toca auth, pricing, pedidos, reparaciones o settings
- se va a eliminar documentacion o scripts historicos

## Politica de documentacion continua

Regla recomendada:

- `project-docs/` = contexto vivo, mapas, estado, metodologia, riesgos
- `next-stack/docs/` = runbooks y operacion del nuevo stack
- `docs/` root = historico/general; revisar gradualmente si debe depurarse

## Practica recomendada para futuras intervenciones

Antes de modificar:

- leer el archivo afectado
- buscar referencias globales
- revisar si el cambio impacta aliases legacy, QA o branding

Despues de modificar:

- reportar exactamente que archivos se tocaron
- explicar por que se tocaron
- indicar si hubo validacion tecnica o si queda pendiente

## Regla de consistencia del repo

- no mezclar decisiones de negocio con limpieza tecnica sin documentarlo
- no introducir librerias nuevas sin justificar necesidad y costo
- no mover la fuente de verdad de assets o settings sin decision explicitamente registrada
- no asumir que algo del legacy es basura solo porque ya no esta en el router nuevo
