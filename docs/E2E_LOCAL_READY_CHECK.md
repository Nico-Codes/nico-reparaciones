# E2E local - cierre rapido

## Objetivo
Tener una validacion E2E repetible en local con dos niveles:
- `critico`: flujos clave de negocio.
- `full`: suite completa.

## Comandos
- Runner Windows:
  - `nico-dev.bat e2e` (solo critico)
  - `nico-dev.bat e2e-full` (critico + full)
- Alternativas directas:
  - `npm run e2e:critical`
  - `npm run e2e:full`
  - `npm run e2e:report`

## Flujos cubiertos por `e2e:critical`
- Registro/autenticacion de cuenta (`e2e/auth-register-account.spec.js`)
- Carrito y checkout (`e2e/store-cart-checkout.spec.js`, `e2e/checkout-authenticated.spec.js`)
- Areas del cliente (`e2e/customer-areas.spec.js`)
- Consulta publica de reparacion (`e2e/repair-lookup-success.spec.js`)
- Guardas admin + operaciones clave (`e2e/admin-access.spec.js`, `e2e/admin-products-flow.spec.js`, `e2e/admin-order-status-transition.spec.js`, `e2e/admin-orders-wa-filters.spec.js`, `e2e/admin-repairs-create-status-wa.spec.js`)

## Criterio de OK local
- `e2e:critical` en verde siempre.
- `e2e:full` en verde antes de cerrar una etapa grande.
- Reporte HTML generado en `playwright-report/index.html`.
