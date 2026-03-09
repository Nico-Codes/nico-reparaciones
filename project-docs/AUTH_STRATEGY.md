# AUTH_STRATEGY

## Estado actual

La autenticacion activa del proyecto es solo auth clasica.

### Soportado hoy en el nuevo stack

- login con email + contrasena
- registro
- refresh token
- verify email
- forgot password
- reset password
- `me` / cuenta
- roles `USER` y `ADMIN`
- 2FA admin por TOTP

### Soportado hoy en el root Laravel historico

- login clasico con email + contrasena
- registro
- verify email
- forgot password
- reset password
- cuenta y cambio de contrasena

## Retirado en Fase 4D

- Google auth legacy
- rutas `/auth/google` y `/auth/google/callback`
- wiring `Socialite` en `AuthController`
- boton visual de Google en el login legacy
- placeholders `/auth/google*` del router React
- config Google dedicada a Socialite en `config/services.php`
- variables `GOOGLE_CLIENT_*` en los `.env.example` del root
- dependencia `laravel/socialite` en `composer.json` y `composer.lock`

## Motivo del retiro

La prioridad actual es simplificar auth y reducir dependencia del root Laravel.

Razones:

- el proyecto sigue en desarrollo
- no hay usuarios reales ni datos criticos que preservar
- Google auth no formaba parte del stack nuevo
- el flujo social era el principal bloqueador funcional del retiro gradual del root legacy
- la arquitectura queda mas clara si el sistema soporta solo auth clasica hasta una futura reimplementacion real

## Residual aceptado

No se hizo cleanup destructivo de esquema en esta fase.

Queda residual:

- migracion legacy `database/migrations/2026_01_05_132552_add_google_id_to_users_table.php`
- posible columna `google_id` en bases legacy ya migradas

Decision vigente:

- no usar `google_id` en codigo nuevo
- no exponerlo en UI
- no mantener logica condicional basada en Google
- dejar su retiro fisico para una fase posterior de cleanup de esquema legacy

## Regla operativa

- auth social Google ya no debe tratarse como feature activa
- cualquier referencia nueva a `/auth/google*`, `Socialite` o variables `GOOGLE_CLIENT_*` debe considerarse drift
- cualquier futura reintroduccion de auth social requiere decision tecnica nueva y registro en `project-docs/DECISIONS_LOG.md`

## Si se quisiera reimplementar Google auth mas adelante

No debe reactivarse el root Laravel para eso.

Deberia hacerse directamente en el nuevo stack:

1. definir decision de producto y UX real
2. implementar endpoints en NestJS
3. definir estrategia de linking de cuentas
4. revisar impacto en `@nico/contracts`
5. agregar tests E2E y smoke dedicados
6. documentar secretos/env y proveedor OAuth

## Fuente de verdad

La estrategia de auth vigente se define por:

- `next-stack/apps/api/src/modules/auth/*`
- `next-stack/apps/web/src/features/auth/*`
- este documento
