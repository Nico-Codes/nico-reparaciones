# First Start Runbook (Staging / Producción)

Runbook para el **primer arranque seguro** del sistema una vez desplegado.

## 1. Precondiciones

- Deploy de código completado
- `.env.production` configurado
- `npm run deploy:check` en OK
- Base de datos creada
- Migraciones aplicadas (`npm run db:migrate:deploy`)
- API levantando con PM2 (`nico-api`)
- Frontend publicado (Nginx o `preview` temporal)

## 2. Verificación técnica inicial (obligatoria)

### API health

- `GET /api/health`
- `GET /api/health/live`
- `GET /api/health/ready`
- `GET /api/health/info`

Esperado:
- `ok: true`
- `ready` con `db: ok`
- `env=production` (si ya estás en prod)

## 3. Admin inicial (seguro)

### Recomendado
- Crear admin inicial por seed/controlado/manual DB en staging
- En producción: **evitar** depender de `bootstrap-admin`

### Si usás bootstrap admin de forma temporal

1. Habilitar temporalmente:
   - `ALLOW_ADMIN_BOOTSTRAP=1`
   - `ADMIN_BOOTSTRAP_KEY=<valor fuerte>`
2. Ejecutar bootstrap (una sola vez)
3. Login y verificar admin
4. **Deshabilitar inmediatamente**
   - `ALLOW_ADMIN_BOOTSTRAP=0`
5. Reiniciar API

## 4. Verificación funcional mínima (post-arranque)

- Login admin
- Dashboard admin carga
- Settings carga/guarda
- Mail templates cargan
- WhatsApp templates/logs cargan
- Productos/categorías listan
- Reparaciones admin lista/crea
- Pedidos admin lista
- Help pública responde

## 5. Verificación de correo (si SMTP ya está listo)

- Registro nuevo usuario
- Verificación de correo
- Forgot password / reset
- Mail de pedido (`order_created`)

Si falla:
- revisar `SMTP_*`
- revisar `mail_from_*` en settings
- revisar logs API (`pm2 logs nico-api`)

## 6. Tareas inmediatas post-arranque

- Confirmar `ALLOW_ADMIN_BOOTSTRAP=0`
- Confirmar `MAIL_PREVIEW_TOKENS=0`
- Confirmar `ALLOW_DEMO_SEED=0`
- Confirmar `CORS_ORIGINS` correcto
- Ejecutar backup inicial de DB

## 7. Snapshot / backup inicial (recomendado)

Después del primer arranque exitoso:

```bash
pg_dump "$DATABASE_URL" -Fc -f "/var/backups/nico-reparaciones/first_start_$(date +%F_%H%M%S).dump"
```

## 8. Criterio de “primer arranque exitoso”

Se considera exitoso si:
- health endpoints OK
- login admin OK
- dashboard admin OK
- al menos una operación de lectura y una de escritura OK
- logs sin errores críticos

