# ROOT_LEGACY_POLICY

## Estado actual

- El runtime Laravel root fue retirado materialmente del repositorio.
- La raiz ya no forma parte del sistema operativo real.
- El codigo vivo del proyecto esta en `next-stack/`.
- En la raiz solo quedan entrypoints del repo, documentacion y material historico puntual.

## Que representa hoy la raiz

- `next-stack/`: stack canonico operativo.
- `project-docs/`: fuente viva de contexto, arquitectura y decisiones.
- `docs/`: apoyo historico/complementario.
- PDFs historicos: material de referencia, no operativo.

## Que ya no existe

- runtime Laravel
- `public/` root como mirror
- `storage/` legacy
- `composer.json` / `composer.lock` del root
- tooling `legacy-support/`

## Politica permanente

- No reintroducir runtime Laravel en la raiz.
- No recrear `public/` root ni mirrors de assets fuera del canon `next-stack/apps/web/public`.
- Si hiciera falta rescate historico puntual, debe hacerse desde backup externo o control de versiones, no desde un runtime paralelo dentro del repo.

## Condicion de retiro final

A nivel tecnico, el root Laravel ya fue retirado. Lo que resta decidir es solo si:

1. se conservan o no materiales historicos no operativos en `docs/` y PDFs root
2. se hace una limpieza final de referencias historicas secundarias
