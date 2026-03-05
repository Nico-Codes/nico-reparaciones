# Pre-Hosting Checklist (Next Stack)

Checklist práctica para dejar `next-stack` listo antes de deploy.

## 1. Entorno local (obligatorio)

- `npm run env:check`
- `npm run deploy:check` (con `.env.production` o `.env` de staging/prod)
- `npm run db:check`
- `npm run db:generate`
- `npm run db:migrate` (aplica migraciones con `prisma migrate deploy`)
- `npm run db:migrate:dev` (solo para crear migraciones nuevas en entornos compatibles)
- `npm run db:seed`
- `npm run qa`
- `npm run qa:backend:full`
- `npm run smoke:web`
- `npm run qa:full`

## 2. Variables de entorno (producción)

Revisar y cambiar:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET` (largo y único)
- `JWT_REFRESH_SECRET` (largo y único)
- `WEB_URL` (dominio real)
- `API_URL` (dominio/subdominio real de API)
- `VITE_API_URL` (normalmente igual a `API_URL`)
- `HOST` / `PORT` (según tu runtime)
- `TRUST_PROXY=1` (si usás Nginx/Proxy delante de Node)
- `LOG_HTTP_REQUESTS` (1/0 según necesidad)
- `LOG_FORMAT` (`plain` o `json`)
- `APP_VERSION` / `GIT_SHA` (opcional, recomendado)
- `CORS_ORIGINS` (restringido a tus dominios)
- copiar base desde `.env.production.example`
- `MAIL_PREVIEW_TOKENS=0`
- `ALLOW_ADMIN_BOOTSTRAP=0`
- `ALLOW_DEMO_SEED=0`

Opcionales / recomendados:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`
- `ADMIN_BOOTSTRAP_KEY` (si mantenés bootstrap en entornos no-prod)

## 3. Base de datos PostgreSQL

- Crear DB destino (ej. `nico_reparaciones_next`)
- Confirmar usuario/clave con permisos de:
  - crear tablas
  - alterar tablas
  - índices
- Hacer backup antes de migraciones en staging/prod

## 4. Seguridad

- Confirmar `JWT_*_SECRET` no sean placeholders
- Confirmar `CORS_ORIGINS` no esté abierto innecesariamente
- Revisar `ADMIN_BOOTSTRAP_KEY` (desactivar o rotar en prod)
- Confirmar `ALLOW_ADMIN_BOOTSTRAP=0`
- Confirmar `MAIL_PREVIEW_TOKENS=0`
- Confirmar `ALLOW_DEMO_SEED=0`
- Confirmar HTTPS en frontend y API

## 5. Correo

- Configurar SMTP real
- Probar:
  - verify email
  - forgot/reset password
  - order created
- Verificar remitente:
  - `mail_from_name`
  - `mail_from_address`

## 6. QA funcional mínimo antes de subir

- Registro / Login / Logout
- Verificación de correo
- Recuperación de contraseña
- Tienda / filtros / detalle
- Carrito / checkout
- Mis pedidos / detalle
- Mis reparaciones / detalle
- Admin dashboard
- Admin pedidos / cambio de estado
- Admin reparaciones / pricing sugerido / edición
- Admin productos/categorías
- Admin usuarios/roles
- Settings / Mail templates / WhatsApp / Ayuda

## 7. Operacion y soporte

- Logs de aplicacion activos (API)
- Plan de backup DB
- Runbook de backup/restore documentado (`docs/BACKUP_RESTORE_RUNBOOK.md`)
- Runbook de primer arranque documentado (`docs/FIRST_START_RUNBOOK.md`)
- Usuario admin inicial validado


 Comandos útiles

- `npm run env:check`
- `npm run deploy:check`
- `npm run db:check`
- `npm run db:migrate` (seguro para staging/prod; usa `migrate deploy`)
- `npm run qa`
- `npm run qa:backend:full`
- `npm run smoke:web`
- `npm run qa:full`


