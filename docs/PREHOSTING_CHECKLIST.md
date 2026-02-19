# Pre-Hosting Checklist (Local -> Produccion)

Checklist concreto para cerrar el proyecto en local y subirlo sin sorpresas.

## 1) Estado minimo esperado en local

En `.env` (ya aplicado):

- `APP_DEBUG=false`
- `ADMIN_ALLOWED_EMAILS` y/o `ADMIN_ALLOWED_IPS` configurados
- `ADMIN_2FA_SESSION_MINUTES=30`
- `SECURITY_HEADERS_ENABLED=true`
- `SECURITY_CSP_ENABLED=true`
- rate limits configurados

## 2) Validacion tecnica obligatoria

Ejecutar:

```bat
php artisan test
npm.cmd run e2e:critical
npm.cmd run build
composer audit
php artisan ops:health-check --strict --assume-production
```

## 3) Fails esperables mientras sigas en HTTP local

Si todavia no usas HTTPS, en `--assume-production` pueden fallar:

- `APP_URL must use HTTPS`
- `SESSION_SECURE_COOKIE must be true`

Eso es correcto en local HTTP.

## 4) Para dejarlo 100% listo antes de hosting

Cuando ya uses dominio/HTTPS real:

1. `APP_URL=https://tu-dominio.com`
2. `SESSION_SECURE_COOKIE=true`
3. (Opcional recomendado) configurar `SENTRY_DSN`
4. Caches de produccion:

```bat
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

5. Revalidar:

```bat
php artisan ops:health-check --strict --assume-production
```

Debe quedar sin `FAIL`.
