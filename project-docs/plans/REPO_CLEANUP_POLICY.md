# REPO CLEANUP POLICY

## Objetivo

Mantener el repo simple, claramente identificado y sin basura historica o transitoria visible en superficie.

## Invariantes

- raiz del repo = capa meta, entrypoints y gobernanza
- `next-stack/` = unico codigo operativo
- `project-docs/` = unica narrativa viva del proyecto
- `next-stack/docs/` = runbooks operativos del stack actual

## Eliminacion directa permitida

- logs temporales fuera de `next-stack/.dev-logs/`
- salidas transitorias fuera de `next-stack/artifacts/`
- archivos vacios o placeholders sin referencias ni uso operativo
- tooling o mirrors legacy ya retirados del runtime y sin referencias reales

## Archivado obligatorio

- documentos de migracion cerrada
- checklists de retiro ya agotadas
- referencias al legado que aporten solo valor historico

## Conservacion obligatoria

- rutas publicas y endpoints vigentes
- scripts npm publicos
- `nico-dev.bat`
- `project-docs/DECISIONS_LOG.md`
- `project-docs/WORKFLOW_AI.md`
- assets canonicos en `next-stack/apps/web/public`

## Regla de validacion

No se elimina nada sin cumplir al menos:

1. busqueda de referencias sin usos vivos
2. typecheck y build en verde para el scope afectado
3. gate QA correspondiente en verde
