# REPO_MAP

## Vista general del repo

Raiz confirmada:

- `C:\xampp\htdocs\nico-reparaciones`

## Estructura principal observada

### Legacy Laravel en raiz
- `app/`
- `bootstrap/`
- `config/`
- `lang/`
- `resources/`
- `routes/`
- `database/`
- `public/`
- `storage/`
- `tests/`
- `e2e/`
- `scripts/`
- `tools/`
- `vendor/`
- `artisan`
- `composer.json`
- `composer.lock`
- `package.json`
- `README.md`

### Nuevo stack
- `next-stack/apps/api`
- `next-stack/apps/web`
- `next-stack/packages/contracts`
- `next-stack/legacy-support`
- `next-stack/scripts`
- `next-stack/docs`

### Documentacion y soporte adicional
- `project-docs/`
- `docs/` root
- `nico-dev.bat`

## Qué es legacy

Legacy o historico funcionalmente secundario:

- la aplicacion Laravel de la raiz
- su `public/` y `storage/`
- sus scripts y docs de operacion historica
- cualquier tooling archivado en `next-stack/legacy-support/deprecated/`

## Qué es el nuevo stack operativo

Operativo real hoy:

- `next-stack/apps/web`
- `next-stack/apps/api`
- `next-stack/packages/contracts`
- `next-stack/scripts`
- `next-stack/docs`
- `project-docs/`

Soporte legacy transitorio todavia activo:

- `next-stack/legacy-support/assets`

Tooling legacy archivado:

- `next-stack/legacy-support/deprecated/api`
- `next-stack/legacy-support/deprecated/qa`
- `next-stack/legacy-support/deprecated/sqlite`

## Scripts relevantes encontrados

En `next-stack/package.json`:

- `npm run env:check`
- `npm run smoke:backend`
- `npm run smoke:web`
- `npm run qa:route-parity`
- `npm run qa:frontend:e2e`
- `npm run qa:admin:visual`
- `npm run qa:responsive:visual`
- `npm run qa:legacy:detach`
- `npm run qa:migration:close`
- `npm run legacy:assets:sync`
- `npm run legacy:parity:deprecated`

## Observacion clave

- `legacy:parity:deprecated` y `legacy:migrate:*:deprecated` ya no son parte del flujo normal.
- Su presencia es historica/transitoria hasta la fase de retiro fuerte del legado.
