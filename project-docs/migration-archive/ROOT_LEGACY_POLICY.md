# ROOT_LEGACY_POLICY

## Estado actual

- El runtime Laravel root fue retirado materialmente del repositorio.
- La raiz ya no forma parte del sistema operativo real.
- El codigo vivo del proyecto esta en `next-stack/`.
- En la raiz solo quedan entrypoints del repo, documentacion viva y archivos meta del proyecto.

## Que representa hoy la raiz

- `next-stack/`: stack canonico operativo.
- `project-docs/`: fuente viva de contexto, arquitectura y decisiones.
- `next-stack/docs/`: runbooks tecnicos del stack actual.

## Que ya no existe

- runtime Laravel
- `public/` root
- `storage/` legacy
- `composer.json` / `composer.lock` del root
- tooling `legacy-support/`
- documentacion legacy de operacion en raiz

## Politica permanente

- No reintroducir runtime Laravel en la raiz.
- No recrear mirrors o compat layers del legado.
- Cualquier necesidad historica debe resolverse desde control de versiones o almacenamiento externo, no recreando el stack retirado.
