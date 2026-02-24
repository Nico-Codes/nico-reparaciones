# Backup & Restore Runbook (PostgreSQL)

Runbook operativo para respaldos y restauración del `next-stack`.

## 1. Objetivo

- Tener backups reproducibles de la base `PostgreSQL`
- Poder restaurar rápido en staging o producción
- Reducir riesgo antes de migraciones/updates

## 2. Estrategia recomendada

- **Backup diario** (`pg_dump` custom format)
- **Backup pre-deploy** (antes de `db:migrate:deploy`)
- **Retención**:
  - diarios: 7
  - semanales: 4
  - mensuales: 3 (opcional)

## 3. Variables necesarias

Tomadas desde `.env.production`:
- `DATABASE_URL`

Opcional (si preferís explícitas):
- `PGHOST`
- `PGPORT`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`

## 4. Backup manual (Linux/VPS)

### Formato recomendado (custom, comprimido)

```bash
mkdir -p /var/backups/nico-reparaciones
pg_dump "$DATABASE_URL" -Fc -f "/var/backups/nico-reparaciones/nico_$(date +%F_%H%M%S).dump"
```

### Backup SQL plano (solo referencia)

```bash
pg_dump "$DATABASE_URL" > "/var/backups/nico-reparaciones/nico_$(date +%F_%H%M%S).sql"
```

## 5. Restore (entorno de prueba / staging)

### Opción A: restaurar sobre DB vacía (recomendado)

```bash
dropdb --if-exists nico_reparaciones_next_restore
createdb nico_reparaciones_next_restore
pg_restore -d nico_reparaciones_next_restore /var/backups/nico-reparaciones/nico_YYYY-MM-DD_HHMMSS.dump
```

### Opción B: limpiar y restaurar en la misma DB (usar con cuidado)

```bash
pg_restore --clean --if-exists -d "$DATABASE_URL" /ruta/backup.dump
```

## 6. Verificación post-restore

- Conectar y validar tablas principales:
  - `users`
  - `orders`
  - `repairs`
  - `products`
- Probar API:
  - `/api/health/ready`
  - login admin
  - dashboard admin

## 7. Backup antes de despliegue (obligatorio)

Antes de:
- `npm run db:migrate:deploy`
- updates grandes

Ejecutar:

```bash
pg_dump "$DATABASE_URL" -Fc -f "/var/backups/nico-reparaciones/predeploy_$(date +%F_%H%M%S).dump"
```

## 8. Procedimiento de rollback (alto nivel)

1. Poner mantenimiento (si aplica)
2. Detener API (`pm2 stop nico-api`)
3. Restaurar backup previo
4. Levantar API (`pm2 start nico-api` / `pm2 restart nico-api`)
5. Verificar:
   - `/api/health/ready`
   - login
   - dashboard

## 9. Automatización (cron) ejemplo

```bash
0 3 * * * pg_dump "$DATABASE_URL" -Fc -f "/var/backups/nico-reparaciones/nico_$(date +\%F_\%H\%M\%S).dump"
```

Sugerido:
- script shell dedicado + rotación (`find ... -mtime +7 -delete`)
- logs de cron a archivo

## 10. Buenas prácticas

- Probar restores periódicamente (no solo generar backups)
- Guardar backups fuera del VPS (objeto/S3/otro servidor)
- Cifrar backups si salen del servidor
- Documentar cuál backup se usó en cada rollback

