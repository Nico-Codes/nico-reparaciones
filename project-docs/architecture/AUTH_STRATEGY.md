# AUTH_STRATEGY

## Estado actual

La autenticacion activa vive solo en `next-stack/` y esta implementada por `AuthModule` en API y `features/auth` en web.

## Soportado hoy

- login con email y contrasena
- registro
- refresh token rotativo guardado en cookie HttpOnly `nico_refresh_token`
- access token Bearer de corta vida para llamadas autenticadas
- verify email
- forgot password
- reset password
- `me` / cuenta
- roles `USER` y `ADMIN`
- 2FA admin por TOTP
- auth social para clientes `USER` con Google, y Apple solo si se configura explicitamente

## Reglas de seguridad

- El refresh token no debe persistirse en `localStorage`; el navegador lo recibe como cookie HttpOnly desde API.
- El frontend puede seguir leyendo el access token para llamadas Bearer, pero la renovacion depende de `/api/auth/refresh` con `credentials: include`.
- Login, registro, completado social, refresh y bootstrap admin emiten o rotan la cookie HttpOnly.
- Logout revoca el refresh token si esta disponible y limpia la cookie.
- En produccion, `WEB_URL`, `API_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGINS` y credenciales sociales habilitadas deben estar configurados con valores reales.
- `ADMIN` no puede entrar por auth social; Google/Apple solo resuelven cuentas `USER`.

## Fuente de verdad

- `next-stack/apps/api/src/modules/auth/*`
- `next-stack/apps/web/src/features/auth/*`
- `next-stack/packages/contracts/src/index.ts`
- `project-docs/DECISIONS_LOG.md`
