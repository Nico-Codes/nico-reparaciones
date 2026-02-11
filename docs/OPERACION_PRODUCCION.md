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

## 3. Flujo de backup y restore

### 3.1 Backup diario con Artisan

```bash
php artisan ops:backup --only=all
```

Opciones utiles:

- Solo base de datos: `php artisan ops:backup --only=db`
- Solo archivos: `php artisan ops:backup --only=files`
- Solo limpieza por retencion: `php artisan ops:backup --prune-only`
- Retencion manual puntual: `php artisan ops:backup --retention-days=30`

Configurable por `.env`:

```dotenv
OPS_BACKUP_TIME=03:15
OPS_BACKUP_PATH=app/backups
OPS_BACKUP_FILES_SOURCE=app/public
OPS_BACKUP_RETENTION_DAYS=14
OPS_BACKUP_COMMAND_TIMEOUT=180
MYSQLDUMP_BINARY=
```

Notas:

- En SQLite de archivo se copia el `.sqlite` completo.
- En MySQL/MariaDB se usa `mysqldump`/`mariadb-dump` (o `MYSQLDUMP_BINARY` si lo definis).
- Cada snapshot guarda `manifest.json` y aplica politica de retencion automaticamente.

### 3.2 Restore de prueba (MySQL)

1. Crear base temporal:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p -e "CREATE DATABASE IF NOT EXISTS nico_reparaciones_restore_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

2. Importar dump desde el snapshot:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p nico_reparaciones_restore_test < storage/app/backups/backup_YYYYMMDD_HHMMSS/database.sql
```

### 3.3 Validacion post-restore

```bash
php artisan migrate:status
php artisan ops:health-check --strict
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
- Configurar cron/scheduler de Laravel (`php artisan schedule:run`) cada minuto.
- Si usas colas async: mantener worker supervisado (`queue:work`).
- Ejecutar CI en cada PR/merge y bloquear deploy si falla.
