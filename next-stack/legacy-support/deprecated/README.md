# Deprecated Legacy Tooling

Este directorio agrupa soporte legado que ya no forma parte del flujo normal del proyecto.

Estado:

- `deprecated/api/*`: migradores legacy archivados. Mantener solo como rescate manual o referencia historica.
- `deprecated/qa/qa-visual-parity.mjs`: parity visual legacy archivada. Ya no es gate ni validacion canonica.
- `deprecated/sqlite/legacy-visual-parity.sqlite`: soporte local solo para la herramienta archivada.

Politica:

- No ejecutar estas herramientas en CI ni como gate rutinario.
- Si alguna necesita volver a usarse, registrar la decision en `project-docs/DECISIONS_LOG.md` y `CHANGELOG_AI.md`.
- Si el root Laravel deja de ser necesario, este directorio pasa a candidato directo de retiro.
