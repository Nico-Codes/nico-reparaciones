# ROOT_LEGACY_POLICY

## Objetivo

Definir que representa hoy la raiz Laravel y bajo que condiciones puede retirarse.

## Estado actual

- La raiz Laravel no es la fuente operativa canonica.
- Sigue siendo un historico activo y sensible.
- Ya no concentra auth social.
- Ya no sostiene el gate principal de parity visual.
- Su anclaje principal hoy es existir como runtime/historico mientras sigan presentes duplicados del root y residuos legacy por retirar.

## Zonas del root

### Soporte todavia activo
- `app/`
- `bootstrap/`
- `config/`
- `database/`
- `public/`
- `resources/`
- `routes/`
- `tests/`
- `e2e/`
- `scripts/`
- `tools/`
- `composer.json`
- `composer.lock`
- `package.json`

### Historico util
- `docs/` root
- `storage/app/backups/`
- `storage/app/benchmarks/`
- PDFs historicos en raiz

### Dependencia local no canonica
- `vendor/`
- `node_modules/`
- `database/database.sqlite`
- `database/e2e.sqlite`

### Artefacto regenerable
- `bootstrap/cache/*`
- `storage/framework/**`
- `storage/logs/*.log`
- `storage/app/dev/*.pid`

## Politica sobre `public/` root

- `public/` root no es fuente de verdad.
- `public/` root es un mirror legacy transitorio.
- No editarlo manualmente como fuente primaria.
- Su retiro fuerte queda habilitado una vez desaparezca la necesidad de runtime legacy y se elimine el tooling deprecated residual.

## Politica sobre storage legacy

- `storage/app/public` y `public/storage` no son fuente canonica.
- Ya no tienen rol operativo principal.
- Solo quedan como fallback historico y candidatos de retiro posterior.

## Que no debe tocarse todavia

- `public/` root mientras no haya decision formal de retiro fuerte
- `composer.json` y `composer.lock` sin cerrar auditoria residual del root
- residuos de esquema legacy sin decision humana

## Condiciones para retiro final del root

1. retirar `legacy-support/deprecated/`
2. retirar duplicados en `public/` root
3. auditar composer residual del root
4. decidir archivo o eliminacion total del runtime Laravel
