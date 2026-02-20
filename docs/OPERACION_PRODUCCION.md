# Operacion y Produccion

Guia operativa para mantener NicoReparaciones estable, segura y recuperable.

Tip rapido:

- Puedes partir de `/.env.production.example` para armar tu `.env` de produccion.

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
ADMIN_ENFORCE_ALLOWLIST_IN_PRODUCTION=true
ADMIN_REQUIRE_REAUTH_MINUTES=30
ADMIN_2FA_SESSION_MINUTES=30
```

Notas:

- No dejes `APP_DEBUG=true` en produccion.
- Configura al menos una allowlist (`ADMIN_ALLOWED_EMAILS` o `ADMIN_ALLOWED_IPS`).
- Mantene 2FA admin activo y con expiracion de sesion razonable (`ADMIN_2FA_SESSION_MINUTES > 0`).
- En produccion, `ops:health-check` marca `FAIL` si `ADMIN_2FA_SESSION_MINUTES=0`.
- En produccion, `ops:health-check` marca `FAIL` si mail no esta listo para envio real (`MAIL_MAILER=log/array` o faltan variables SMTP requeridas).

## 2. Health check operacional

Comando nuevo:

```bash
php artisan ops:health-check
```

Modo estricto (falla tambien con warnings):

```bash
php artisan ops:health-check --strict
```

Modo produccion forzado (util para validar en local/staging):

```bash
php artisan ops:health-check --strict --assume-production
```

Atajo por Composer:

```bash
composer ops:check
composer ops:check:strict
```

Preflight completo de produccion (recomendado antes de cada deploy):

```bash
composer run ops:prepare:production
```

En Windows:

```bat
nico-dev.bat prod-preflight
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

## 4. Monitoreo de errores y alertas

Variables recomendadas:

```dotenv
MONITORING_ENABLED=true
SENTRY_DSN=
OPS_ALERTS_ENABLED=true
OPS_ALERTS_CHANNEL=ops_alerts
OPS_ALERTS_DEDUPE_MINUTES=10
OPS_ALERT_STACK=ops_daily
OPS_ALERT_WEBHOOK_URL=
```

Notas:

- Si `SENTRY_DSN` esta configurado y Sentry esta integrado en runtime, las excepciones se capturan automaticamente.
- Alertas operativas se emiten por `OPS_ALERTS_CHANNEL` con deduplicacion para evitar spam.
- `ops_alerts` por defecto escribe en `storage/logs/ops-alerts.log` (`ops_daily`).
- Para alertas externas (Slack/Discord webhook compatible), setear `OPS_ALERT_WEBHOOK_URL` y usar `OPS_ALERT_STACK=ops_slack,ops_daily`.

Comando de prueba:

```bash
php artisan ops:alert-test
```

## 5. Reporte semanal de KPIs (email)

Variables recomendadas:

```dotenv
OPS_WEEKLY_REPORT_EMAILS=ops@tu-dominio.com,owner@tu-dominio.com
OPS_WEEKLY_REPORT_DAY=monday
OPS_WEEKLY_REPORT_TIME=08:00
OPS_WEEKLY_REPORT_RANGE_DAYS=30
OPS_MAIL_ASYNC_ENABLED=true
OPS_MAIL_QUEUE=mail
OPS_MAIL_TRIES=3
OPS_MAIL_BACKOFF_SECONDS=60,300,900
OPS_MAIL_ALERTS_ON_FAILURE=true
```

Comando manual:

```bash
php artisan ops:dashboard-report-email --range=30 --to=ops@tu-dominio.com
```

Alertas operativas (pedidos/reparaciones demoradas):

```bash
php artisan ops:operational-alerts-email --force
```

Prueba puntual de mail (smoke test):

```bash
php artisan ops:mail-test --to=ops@tu-dominio.com
php artisan ops:mail-test --to=ops@tu-dominio.com --force-sync
```

Notas:

- El comando adjunta CSV con KPIs + top productos.
- El scheduler ya ejecuta `ops:dashboard-report-email` semanalmente segun `OPS_WEEKLY_REPORT_DAY/TIME`.
- Tambien puedes configurar destinatarios/dia/hora/rango desde `Admin > Configuracion` (sobrescribe los valores de `.env`).
- Si no hay destinatarios configurados, el comando falla para evitar falsa sensacion de cobertura operativa.
- Si `OPS_MAIL_ASYNC_ENABLED=true`, los correos se encolan (queue `OPS_MAIL_QUEUE`) y usan reintentos/backoff.

## 6. Deploy sugerido (sin downtime prolongado)

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

## 7. Performance de servidor web (Apache/Nginx)

Objetivo: mejorar TTFB percibido y carga inicial sin tocar logica de negocio.

- Activar compresion (`gzip`/`brotli`) para `css/js/json/svg`.
- Cache largo para assets versionados (`public/build/*`): `Cache-Control: public, max-age=31536000, immutable`.
- HTML/respuestas dinamicas: `no-store` (evita cache de sesiones/panel).

En Apache (este proyecto) ya se agrego en `public/.htaccess`:

- `mod_deflate` (compresion)
- `mod_expires` (TTL por tipo de archivo)
- `mod_headers` (cache headers + `Vary: Accept-Encoding`)

Si migras a Nginx, replica la misma estrategia de headers.

### OPcache (PHP)

Recomendado en produccion para bajar latencia en PHP:

```ini
opcache.enable=1
opcache.enable_cli=0
opcache.memory_consumption=192
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000
opcache.validate_timestamps=1
opcache.revalidate_freq=2
```

Notas:

- En hosting compartido suele venir activo por defecto.
- En VPS propio, aplicar en `php.ini` y reiniciar PHP-FPM/Apache.

## 8. Operacion continua

- Revisar `storage/logs` diariamente (errores 5xx, auth y DB).
- Rotar backups y verificar espacio en disco.
- Configurar cron/scheduler de Laravel (`php artisan schedule:run`) cada minuto.
- Si usas colas async: mantener worker supervisado (`queue:work`).
- Para correo async, priorizar cola de mail: `php artisan queue:work --queue=mail,default --tries=3 --backoff=60`.
- Ejecutar CI en cada PR/merge y bloquear deploy si falla.
