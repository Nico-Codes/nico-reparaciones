# MIGRATION_STATUS

## Estado resumido

Conclusion tecnica actual:

- la migracion local del sistema operativo principal esta cerrada
- el stack operativo real es `next-stack`
- el legacy de raiz ya no es la base funcional principal
- parity legacy y migradores legacy quedaron deprecados y fuera del flujo normal

## Evidencia tecnica confirmada

- existe `qa:migration:close` en `next-stack/package.json`
- existe `qa:legacy:detach` en `next-stack/package.json`
- el gate canonico ya no requiere `qa:visual-parity`
- `legacy:parity:deprecated` y `legacy:migrate:*:deprecated` siguen presentes solo como soporte manual/historico

## Que parte de la migracion esta cerrada

Cerrado localmente:

- backend NestJS operativo
- frontend React operativo
- Prisma/PostgreSQL como base principal
- rutas y aliases legacy criticos mapeados
- assets visuales migrados al nuevo frontend
- desacople tecnico principal respecto al legacy

## Pendientes reales

- deploy productivo real
- sign-off visual manual final si se desea para el entorno destino
- retiro fuerte del root Laravel historico
- retiro final de duplicados root y tooling deprecated

## Estado del desacople respecto al legacy

- desacople funcional principal: logrado
- desacople del repo: avanzado, pero todavia pendiente del retiro del root y duplicados root
