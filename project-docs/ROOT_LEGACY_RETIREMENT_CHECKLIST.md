# ROOT_LEGACY_RETIREMENT_CHECKLIST

## Etapa 1 - Ya ejecutado

- limpieza de caches y artefactos regenerables del root
- retiro de Google auth legacy y `laravel/socialite`
- cuarentena explicita de soporte legacy en `next-stack/legacy-support/`
- definicion del canon de assets en `next-stack/apps/web/public`
- conversion de `public/` root a mirror legacy
- deprecacion formal de parity visual legacy y migradores legacy

## Etapa 2 - Retiro del tooling deprecated

### Bloqueadores actuales
- `next-stack/legacy-support/deprecated/qa/qa-visual-parity.mjs`
- `next-stack/legacy-support/deprecated/sqlite/legacy-visual-parity.sqlite`
- `next-stack/legacy-support/deprecated/api/migrate-legacy-settings.ts`
- `next-stack/legacy-support/deprecated/api/migrate-legacy-product-images.ts`
- `next-stack/legacy-support/deprecated/api/migrate-legacy-visual-assets.ts`

### Checklist
- confirmar que no se necesita mas parity visual contra Laravel
- confirmar que no se necesita mas rescate de settings/assets legacy
- retirar la carpeta `legacy-support/deprecated/`

## Etapa 3 - Duplicados root y fallback storage

- retirar `public/` root como mirror de compatibilidad cuando el runtime legacy deje de ser necesario
- revisar si `storage/app/public` y `public/storage` pueden retirarse por completo

## Etapa 4 - Composer y runtime residual

- auditar `predis/predis`
- revisar `e2e/`, `scripts/`, `tools/` y `tests/` root
- decidir destino de docs historicas, backups y benchmarks

## Etapa 5 - Retiro final del root

Prerequisitos minimos:
- `legacy-support/deprecated/` retirado
- `public/` root sin rol operativo real
- composer legacy auditado
- decision humana explicita sobre archivo o retiro completo
