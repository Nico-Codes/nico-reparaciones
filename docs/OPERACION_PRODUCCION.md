# Operacion y Produccion

Guia operativa para mantener NicoReparaciones estable, segura y recuperable.

## 1. Hardening minimo de `.env` (produccion)

Valores recomendados:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tu-dominio.com

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax

QUEUE_CONNECTION=database
CACHE_STORE=database

SECURITY_HEADERS_ENABLED=true
SECURITY_CSP_ENABLED=true

ADMIN_ALLOWED_EMAILS=admin1@tu-dominio.com,admin2@tu-dominio.com
ADMIN_ALLOWED_IPS=203.0.113.10,198.51.100.0/24
ADMIN_REQUIRE_REAUTH_MINUTES=30
ADMIN_2FA_SESSION_MINUTES=30
```

Notas:

- No dejes `APP_DEBUG=true` en produccion.
- Configura al menos una allowlist (`ADMIN_ALLOWED_EMAILS` o `ADMIN_ALLOWED_IPS`).
- Mantene 2FA admin activo y con expiracion de sesion razonable.

## 2. Health check operacional

Comando nuevo:

```bash
php artisan ops:health-check
```

Modo estricto (falla tambien con warnings):

```bash
php artisan ops:health-check --strict
```

Atajo por Composer:

```bash
composer ops:check
composer ops:check:strict
```

Este check valida:

- Seguridad base (`APP_DEBUG`, cookies seguras, headers, CSP).
- Conectividad DB y tablas core.
- Cache principal y cache de contadores admin.
- Driver de colas.
- Permisos de escritura en `storage` y `bootstrap/cache`.
- Estado de `config:cache` y `route:cache`.

## 3. Flujo de backup y restore (MySQL)

### 3.1 Backup diario

```bash
mysqldump -h 127.0.0.1 -P 3306 -u root -p nico_reparaciones > backup_nico_reparaciones.sql
```

### 3.2 Restore de prueba (base temporal)

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p -e "CREATE DATABASE IF NOT EXISTS nico_reparaciones_restore_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -h 127.0.0.1 -P 3306 -u root -p nico_reparaciones_restore_test < backup_nico_reparaciones.sql
```

### 3.3 Validacion post-restore

```bash
php artisan migrate:status
php artisan ops:health-check
```

Recomendacion: ejecutar restore de prueba al menos 1 vez por mes.

## 4. Deploy sugerido (sin downtime prolongado)

```bash
php artisan down --render=errors::503
composer install --no-dev --prefer-dist --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan optimize
php artisan up
php artisan ops:health-check --strict
```

## 5. Operacion continua

- Revisar `storage/logs` diariamente (errores 5xx, auth y DB).
- Rotar backups y verificar espacio en disco.
- Si usas colas async: mantener worker supervisado (`queue:work`).
- Ejecutar CI en cada PR/merge y bloquear deploy si falla.
