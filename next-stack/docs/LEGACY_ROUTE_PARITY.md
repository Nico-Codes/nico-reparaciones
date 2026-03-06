# Legacy Route Parity (Web/SPA)

Estado de compatibilidad de rutas legacy de Laravel contra el router React (`apps/web/src/App.tsx`), más chequeo de views, botones y acciones.

## Rutas cubiertas con alias/redirect

### Público y auth
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
- `/mi-cuenta` -> `/mi-cuenta` (view React real)
- `/email/verificar` -> `/auth/verify-email`
- `/email/verificar/:id/:hash` -> `/auth/verify-email`
- `/reparacion/:id/presupuesto` -> `/reparacion/:id/presupuesto` (view React real)

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
- `/admin/configuracion/identidad-visual` -> `/admin/configuracion/identidadvisual`
- `/admin/configuracion/portada-tienda` -> `/admin/configuracion/portadatienda`
- `/admin/configuracion/correos` -> `/admin/mail-templates`
- `/admin/configuracion/ayuda` -> `/admin/help`
- `/admin/whatsapp-pedidos` -> `/admin/whatsapppedidos`
- `/admin/tipos-reparacion` -> `/admin/tiposreparacion`
- `/admin/grupos-modelos` -> `/admin/gruposmodelos`
- `/admin/tipos-dispositivo` -> `/admin/tiposdispositivo`
- `/admin/catalogo-dispositivos` -> `/admin/catalogodispositivos`
- `/admin/categorias` -> `/admin/categorias` (view React real)
- `/admin/categorias/crear` -> `/admin/categorias/crear` (view React real)
- `/admin/categorias/:id/editar` -> `/admin/categorias/:id/editar` (view React real)
- `/admin/productos/:id/etiqueta` -> `/admin/productos/:id/etiqueta` (view React real)
- `/admin/precios/:id/editar` -> `/admin/precios/:id/editar` (view React real)
- `/admin/ventas-rapidas` -> `/admin/ventas-rapidas` (view React real)
- `/admin/ventas-rapidas/ticket` -> `/admin/ventas-rapidas/ticket` (view React real)
- `/admin/ventas-rapidas/historial` -> `/admin/ventas-rapidas/historial` (view React real)

## Compatibilidad de views/botones/acciones

- Navegación de frontend:
- 58 paths detectados en `to`, `navigate` y `href`.
- 0 paths sin route definido en `apps/web/src/App.tsx`.

- Acciones API frontend:
- 77 llamados únicos detectados en `apps/web/src/features/**/(api|http).ts`.
- 0 llamados sin endpoint backend (comparados contra controllers de Nest en `apps/api/src/modules/**`).

Este chequeo queda automatizado con:
- `npm run qa:route-parity`

## Validación técnica ejecutada

- `npm run qa:route-parity` -> OK
- `npm run smoke:web` -> OK
- `npm run qa:frontend:e2e` -> OK (cubre aliases legacy públicos, rutas admin críticas y chequeo de mojibake en render)
- `npm run qa:visual-parity` -> OK (capturas legacy+next generadas y reporte consolidado)
- `npm run qa:admin:visual` -> OK (auditoría de vistas admin sin rutas fallidas ni mojibake)
- `npm run qa:responsive:visual` -> OK (capturas desktop/tablet/mobile sin fallos ni mojibake)
- `npm run qa:backend:full` -> OK (db/check/migrate/seed + smoke backend completo)
- `npm run qa:migration:close` -> OK (gate final de cierre técnico)

## Validación visual automatizada (legacy vs next)

- Script: `scripts/qa-visual-parity.mjs`
- Comando: `npm run qa:visual-parity`
- Salida: `artifacts/visual-parity/<timestamp>/report.md` + capturas `*.legacy.png` / `*.next.png`
- Estado local actual: OK con legacy levantado y comparación completa ejecutada.
- Último reporte validado: `artifacts/visual-parity/20260306-103733/report.md`.

## Assets visuales legacy compatibles

- `brand/**` (logo e identidad)
- `icons/**` (iconos de navegación y panel)
- `img/**` (imágenes generales legacy)
- `brand-assets/**` (assets de portada y branding)
- `favicon.ico`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`
- `apple-touch-icon.png`
- `site.webmanifest`

Todo lo anterior quedó migrado con `npm run db:migrate:visual-assets`.

## Pendientes funcionales (sin paridad 1:1 aún)

- Sin pendientes de rutas legacy mapeadas en este documento.
