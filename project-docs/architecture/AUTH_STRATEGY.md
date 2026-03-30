# AUTH_STRATEGY

## Estado actual

La autenticacion activa del proyecto es solo auth clasica implementada en el nuevo stack.

## Soportado hoy

- login con email + contraseña
- registro
- refresh token
- verify email
- forgot password
- reset password
- `me` / cuenta
- roles `USER` y `ADMIN`
- 2FA admin por TOTP

## Retirado

- Google auth legacy
- rutas `/auth/google` y `/auth/google/callback`
- wiring `Socialite`
- placeholders de Google auth en frontend
- variables `GOOGLE_CLIENT_*`
- dependencias y config asociadas al flujo social legacy

## Motivo del retiro

- simplificar la estrategia de auth
- evitar reintroducir un segundo stack o un proveedor OAuth sin implementacion real en el backend actual
- mantener el proyecto consistente con el estado final del repo

## Regla operativa

- auth social Google no forma parte del producto actual
- cualquier futura reintroduccion de auth social requiere decision tecnica nueva, implementacion en `next-stack/` y registro en `project-docs/DECISIONS_LOG.md`

## Fuente de verdad

La estrategia de auth vigente se define por:

- `next-stack/apps/api/src/modules/auth/*`
- `next-stack/apps/web/src/features/auth/*`
- este documento
