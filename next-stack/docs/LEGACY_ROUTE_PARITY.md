# Legacy Route Parity (Web/SPA)

Estado de compatibilidad de rutas legacy de Laravel contra el router React (`apps/web/src/App.tsx`), mas chequeo de views, botones y acciones.

## Rutas cubiertas con alias/redirect

### Publico y auth
- `/tienda` -> `/store`
- `/tienda/categoria/:slug` -> `/store?category=:slug`
- `/producto/:slug` -> `/store/:slug`
- `/ayuda` -> `/help`
- `/login` -> `/auth/login`
- `/registro` -> `/auth/register`
- `/olvide-contrasena` -> `/auth/forgot-password`
- `/resetear-contrasena/:token` -> `/auth/reset-password?token=:token`
- `/carrito` -> `/cart`
- `/mis-pedidos` -> `/orders`
- `/mis-pedidos/:id` -> `/orders/:id`
- `/pedido/:id` -> `/orders/:id`
- `/mis-reparaciones` -> `/repairs`
- `/mis-reparaciones/:id` -> `/repairs/:id`
- `/mi-cuenta` -> `/mi-cuenta`
- `/email/verificar` -> `/auth/verify-email`
- `/email/verificar/:id/:hash` -> `/auth/verify-email`
- `/reparacion/:id/presupuesto` -> `/reparacion/:id/presupuesto`

### Admin
- `/admin/dashboard` -> `/admin`
- `/admin/pedidos` -> `/admin/orders`
- `/admin/pedidos/:id` -> `/admin/orders/:id`
- `/admin/pedidos/:id/imprimir` -> `/admin/orders/:id/print`
- `/admin/pedidos/:id/ticket` -> `/admin/orders/:id/ticket`
- `/admin/reparaciones` -> `/admin/repairs`
- `/admin/reparaciones/crear` -> `/admin/repairs`
- `/admin/reparaciones/:id` -> `/admin/repairs/:id`
- `/admin/reparaciones/:id/imprimir` -> `/admin/repairs/:id/print`
- `/admin/reparaciones/:id/ticket` -> `/admin/repairs/:id/ticket`
- `/admin/usuarios` -> `/admin/users`
- `/admin/configuracion` -> `/admin/configuraciones`

## Validacion tecnica vigente

- `npm run qa:route-parity` -> OK
- `npm run smoke:web` -> OK
- `npm run qa:frontend:e2e` -> OK
- `npm run qa:admin:visual` -> OK
- `npm run qa:responsive:visual` -> OK
- `npm run qa:backend:full` -> OK
- `npm run qa:migration:close` -> OK

## Nota sobre parity legacy

- `qa:visual-parity` ya no es parte del baseline canonico.
- Si se necesitara ejecutar de forma manual, la herramienta archivada vive en `next-stack/legacy-support/deprecated/qa/qa-visual-parity.mjs`.
