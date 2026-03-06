# MIGRATION_STATUS

## Estado resumido

Conclusion tecnica actual:

- la migracion local del sistema operativo principal esta cerrada
- el stack operativo real es `next-stack`
- el legacy de raiz ya no es la base funcional principal

## Evidencia tecnica confirmada

Evidencias detectadas en el repo:

- existe `qa:migration:close` en `next-stack/package.json`
- existe `qa:legacy:detach` en `next-stack/package.json`
- existe documentacion de cierre en:
  - `next-stack/docs/MIGRATION_STATUS.md`
  - `next-stack/docs/MIGRATION_ROADMAP.md`
  - `next-stack/docs/LEGACY_ROUTE_PARITY.md`
  - `next-stack/docs/UI_PARITY_FINAL_CHECKLIST.md`
- `nico-dev.bat` ya incorpora `next-close`

## Que parte de la migracion esta cerrada

Cerrado localmente:

- backend NestJS operativo
- frontend React operativo
- Prisma/PostgreSQL como base principal
- rutas y aliases legacy criticos mapeados
- QA tecnica de cierre disponible y ejecutada
- assets visuales migrados al nuevo frontend
- desacople tecnico principal respecto al legacy validado por script

## Que no debe confundirse con migracion pendiente

No es deuda de migracion funcional, sino de operacion productiva:

- deploy real
- SSL, dominio y reverse proxy
- secretos productivos finales
- sign-off visual manual final en entorno destino

## Cruces vivos con el legacy

Aunque la base funcional nueva esta cerrada, el repo todavia mantiene dependencias de soporte hacia el legacy:

- `qa-visual-parity.mjs` sigue pudiendo levantar el Laravel root para comparar capturas
- scripts Prisma `migrate-legacy-*` leen informacion o assets del legacy
- `migrate-legacy-visual-assets.ts` usa `public/` root como fuente candidata
- existen assets duplicados en `public/` root y `next-stack/apps/web/public/`

Esto significa:

- migracion cerrada no equivale a legacy eliminable hoy
- todavia hay valor historico y tecnico en conservar partes del root hasta auditar limpieza

## Contraste entre documentos existentes

Hallazgo importante:

- el documento maestro `docs/CONOCIMIENTO_COMPLETO_NICOREPARACIONES.txt` trata la migracion local como cerrada
- `next-stack/docs/MIGRATION_STATUS.md` aun la expresa como `99%` por deploy y sign-off manual

Interpretacion recomendada:

- migracion funcional local: cerrada
- cierre operativo total de producto: pendiente de deploy real y validacion final en entorno destino

## Estado del desacople respecto al legacy

Confirmado por repo:

- no se detecto dependencia de runtime del Laravel root hacia `next-stack`
- si se detectaron dependencias de soporte del `next-stack` hacia el root para migracion y QA visual

Conclusion:

- desacople funcional principal: logrado
- desacople total del repo: pendiente de limpieza y politica final sobre legacy historico

## Pendientes reales antes de una limpieza profunda

- definir que partes del legacy deben quedar congeladas por referencia historica
- decidir si la paridad visual seguira dependiendo del root o de snapshots estaticos
- decidir fuente canonica de assets entre `public/` root y `apps/web/public`
- decidir politica de retencion para scripts `migrate-legacy-*`
