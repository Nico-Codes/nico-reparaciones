# ASSET_STRATEGY

## Objetivo

Definir una politica unica y mantenible para los assets visuales del proyecto, separando la fuente canonica del soporte legacy transitorio.

## Fuente canonica vigente

La unica fuente canonica de assets visuales del sistema es:

- `next-stack/apps/web/public`

Incluye:

- favicons
- `site.webmanifest`
- `brand/`
- `brand-assets/`
- `icons/`
- `img/`
- `storage/` del nuevo stack para imagenes de productos

## Evidencia tecnica confirmada

- `next-stack/apps/api/src/main.ts` sirve estaticos desde `apps/web/public`.
- `next-stack/apps/api/src/modules/admin/admin.service.ts` y `next-stack/apps/api/src/modules/catalog-admin/catalog-admin.service.ts` escriben y resuelven assets desde `apps/web/public`.
- `next-stack/apps/web/index.html` y `next-stack/apps/web/src/components/BrandingHeadSync.tsx` apuntan al set publico del nuevo stack.
- Inventario Fase 4E: 22 assets relevantes comparados entre `public/` root y `next-stack/apps/web/public`, sin diferencias por hash.
- `storage/app/public` y `public/storage` del root legacy hoy no contienen assets vivos; solo `.gitignore`.

## Que es legacy/transitorio

### `public/` root

- Rol actual: mirror de compatibilidad del runtime legacy.
- No debe tratarse como origen de verdad.
- Se mantiene solo mientras el root Laravel siga existiendo como historico sensible.

### `storage/app/public` y `public/storage`

- Rol actual: fallback historico para migradores legacy ya deprecados.
- Estado real actual: no contienen archivos vivos relevantes.
- No deben usarse como fuente primaria para assets nuevos.

### `next-stack/legacy-support/assets/`

- Rol actual: encapsular la compatibilidad canon -> root legacy.
- Script principal:
  - `next-stack/legacy-support/assets/sync-canonical-assets-to-legacy-root.mjs`

## Tooling legacy deprecated

### `next-stack/legacy-support/deprecated/api/migrate-legacy-visual-assets.ts`
- Estado: deprecated.
- Solo conserva valor como rescate manual/historico.
- Prioriza el canon y deja el root como fallback.

### `next-stack/legacy-support/deprecated/api/migrate-legacy-product-images.ts`
- Estado: deprecated.
- Solo conserva valor como rescate manual/historico.
- Prioriza `next-stack/apps/web/public/storage` y deja storage legacy como fallback.

### `next-stack/legacy-support/deprecated/qa/qa-visual-parity.mjs`
- Estado: deprecated.
- Ya no forma parte del gate operativo.
- Si se ejecuta manualmente, sincroniza el canon hacia `public/` root antes de capturar.

## Regla operativa

- Todo asset visual nuevo o modificado debe nacer en `next-stack/apps/web/public`.
- No editar `public/` root manualmente como fuente primaria.
- No usar tooling deprecated como justificacion para reintroducir duplicacion de assets.

## Que retirar despues

Orden recomendado:

1. retirar `legacy-support/deprecated/`
2. retirar duplicados de `public/` root
3. decidir si `storage/app/public` y `public/storage` pueden dejar de existir como soporte legacy

## Anti-drift

Cualquier cambio futuro que:

- vuelva a tratar `public/` root como fuente canonica
- reintroduzca duplicacion no justificada
- escriba assets del nuevo stack fuera de `apps/web/public`

se considera drift y debe corregirse o registrarse en `project-docs/DECISIONS_LOG.md`.
