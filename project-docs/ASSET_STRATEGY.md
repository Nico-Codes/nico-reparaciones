# ASSET_STRATEGY

## Fuente canonica

La unica fuente canonica de assets visuales es:

- `next-stack/apps/web/public`

## Estado actual

- `public/` root fue retirado.
- no existe mirror legacy de assets en la raiz.
- parity y tooling legacy ya no usan ni sincronizan assets root.

## Regla de mantenimiento

- agregar, editar o reemplazar assets solo en `next-stack/apps/web/public`
- no recrear capas de sync o mirrors fuera del canon
- si se necesita snapshot historico puntual, usar control de versiones o backups externos
