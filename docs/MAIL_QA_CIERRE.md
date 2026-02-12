# QA Cierre Mail (Local)

Checklist rapido para validar correo local con Mailpit en NicoReparaciones.

## 1) Arranque

1. Ejecutar `nico-dev.bat start`.
2. Confirmar:
   - Web: `http://127.0.0.1:8000`
   - Mailpit: `http://127.0.0.1:8025`
   - Cola mail activa en salida del script.

## 2) Smoke test tecnico

1. Ejecutar `php artisan ops:mail-test --to=admin@nico.local --force-sync`.
2. Ejecutar `php artisan ops:mail-test --to=admin@nico.local` (encolado).
3. Verificar en `http://127.0.0.1:8025` que ingresen ambos correos.

## 3) Flujos de negocio

1. Registro:
   - Crear cuenta nueva.
   - Verificar que llegue email "Verifica tu correo en NicoReparaciones".
2. Recuperacion:
   - Ir a "Olvide mi contrasena".
   - Verificar que llegue email de reset.
3. Compra:
   - Completar carrito y confirmar checkout.
   - Verificar que llegue email "Confirmacion de pedido #...".

## 4) Verificaciones de estado

1. Ejecutar `php artisan ops:health-check`.
2. Esperado:
   - `SMTP mail` = `OK`.
   - `Mail async dispatch` = `OK`.
   - `QUEUE_CONNECTION` = `OK`.

## 5) Cierre

1. Ejecutar `nico-dev.bat stop`.
2. Confirmar que no queden procesos `mailpit.exe` ni `queue:work` activos.
