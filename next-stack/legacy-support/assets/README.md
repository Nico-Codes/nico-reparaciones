# Legacy Assets Support

Esta carpeta contiene soporte transitorio para compatibilidad de assets entre el canon del nuevo stack y el runtime legacy.

## Regla vigente

- La fuente canonica es `next-stack/apps/web/public`.
- `public/` root es un espejo de compatibilidad para runtime/parity legacy.
- No editar `public/` root manualmente como fuente primaria.

## Script principal

- `sync-canonical-assets-to-legacy-root.mjs`
  - copia favicons, manifest, `brand/`, `brand-assets/`, `icons/` e `img/` desde el canon hacia `public/` root.
  - no elimina extras legacy.
  - se usa para mantener parity legacy sin tratar el root como fuente de verdad.
