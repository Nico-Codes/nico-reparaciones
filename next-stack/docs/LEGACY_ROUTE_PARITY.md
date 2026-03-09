# LEGACY_ROUTE_PARITY

## Estado actual

- los aliases legacy del router React siguen controlados por `qa:route-parity`
- el runtime Laravel y la parity visual legacy ya no forman parte del repositorio operativo

## Alcance del check

`qa:route-parity` valida solo el stack nuevo:
- rutas definidas en `App.tsx`
- aliases legacy mantenidos por compatibilidad de navegacion
- endpoints consumidos por el frontend frente al backend NestJS
