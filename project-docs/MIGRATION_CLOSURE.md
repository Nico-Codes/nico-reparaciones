# MIGRATION_CLOSURE

## Resumen ejecutivo

La migracion de NicoReparaciones al nuevo stack esta oficialmente cerrada.

El proyecto quedo consolidado sobre una sola base operativa:
- frontend React en `next-stack/apps/web`
- backend NestJS en `next-stack/apps/api`
- persistencia con Prisma + PostgreSQL
- documentacion viva en `project-docs/`

## Que se migro

- tienda publica
- carrito y checkout
- auth clasica completa
- pedidos de usuario y admin
- reparaciones de usuario y admin
- modulos admin de productos, configuracion, pricing, catalogo tecnico, proveedores, garantias, contabilidad, ayuda, WhatsApp y seguridad 2FA
- assets visuales y branding dinamico
- scripts de QA, smoke, route parity y checks de desacople

## Que se retiro

- runtime Laravel root
- assets publicos root como fuente operativa
- auth social legacy Google
- parity visual legacy como parte del flujo normal
- migradores legacy como parte del flujo normal
- soporte tecnico legacy dentro del repo activo

## Decisiones clave

- unificar el codigo operativo en `next-stack/`
- unificar la documentacion viva en `project-docs/`
- declarar `next-stack/apps/web/public` como unica fuente canonica de assets
- declarar `next-stack/.env` como unica fuente canonica de entorno
- retirar completamente el root Laravel en lugar de conservarlo como runtime historico

## Estado final del repo

- `next-stack/` = sistema operativo real
- `project-docs/` = fuente de verdad documental
- `next-stack/docs/` = runbooks del stack actual
- la raiz del repo funciona como entrypoint y contenedor del proyecto, no como segundo stack

## Criterios usados para declarar el cierre

- el stack nuevo compila y tipa correctamente
- los smokes funcionales pasan
- la paridad de rutas del frontend pasa
- el check de desacople respecto al legacy pasa
- no queda runtime legacy sosteniendo la app ni el gate principal

## Checks finales usados

- `npm run env:check`
- `npm run typecheck --workspace @nico/api`
- `npm run typecheck --workspace @nico/web`
- `npm run build --workspace @nico/api`
- `npm run build --workspace @nico/web`
- `npm run smoke:backend`
- `npm run smoke:web`
- `npm run qa:route-parity`
- `npm run qa:legacy:detach`

## Que ya no existe en el proyecto

- Laravel root como backend activo
- Blade como frontend operativo
- MySQL como base principal del sistema
- tooling legacy dentro del flujo normal del repo
- dualidad de stacks dentro del mismo repositorio operativo

## Base de trabajo a futuro

A partir de este cierre, el desarrollo normal debe ocurrir solo sobre:
- `next-stack/apps/web`
- `next-stack/apps/api`
- `next-stack/packages/contracts`
- `project-docs/`
