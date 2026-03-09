# Legacy Support

Este arbol contiene compatibilidad transitoria del legado Laravel.

No es parte del nucleo operativo diario del nuevo stack.

Estructura actual:

- `assets/`: compatibilidad canon -> root legacy mientras exista el runtime historico.
- `deprecated/`: tooling legacy ya fuera del flujo normal.

Contenido `deprecated/`:

- `deprecated/api/`: migradores legacy conservados solo como rescate manual/historico.
- `deprecated/qa/`: parity visual legacy archivada como herramienta manual.
- `deprecated/sqlite/`: SQLite local asociada al parity legado archivado.

Reglas:

- No tratar `legacy-support` como runtime diario.
- No mover piezas deprecated al arbol operativo (`apps/*`, `scripts/`) salvo una decision tecnica registrada.
- `public/` root sigue siendo solo un mirror/runtime legacy; el canon de assets es `next-stack/apps/web/public`.
