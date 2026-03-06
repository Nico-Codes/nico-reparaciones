# Pre-Hosting Checklist (Next Stack)

Checklist para dejar `next-stack` listo antes de deploy.

## 1) Entorno local (obligatorio)

- `npm run env:check`
- `npm run deploy:check` (con `.env.production` o `.env` de staging/prod)
- `npm run db:check`
- `npm run db:generate`
- `npm run db:migrate` (`prisma migrate deploy`)
- `npm run db:seed`
- `npm run qa:migration:close`

## 2) Variables de entorno (producción)

Revisar y ajustar:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET` (largo y único)
- `JWT_REFRESH_SECRET` (largo y único)
- `WEB_URL` (dominio real)
- `API_URL` (dominio/subdominio real de API)
- `VITE_API_URL` (normalmente igual a `API_URL`)
- `HOST` / `PORT` (según runtime)
- `TRUST_PROXY=1` (si hay Nginx/Proxy)
- `CORS_ORIGINS` (restringido a tus dominios)
- `MAIL_PREVIEW_TOKENS=0`
- `ALLOW_ADMIN_BOOTSTRAP=0`
- `ALLOW_DEMO_SEED=0`

## 3) Base de datos PostgreSQL

- Crear DB destino (ej. `nico_reparaciones_next`)
- Confirmar permisos para tablas/índices/alter
- Hacer backup antes de migraciones en staging/prod

## 4) Seguridad

- Confirmar `JWT_*_SECRET` no placeholders
- Confirmar `CORS_ORIGINS` sin orígenes de dev
- Confirmar bootstrap admin desactivado en prod
- Confirmar HTTPS en frontend y API

## 5) Correo

- Configurar SMTP real
- Probar:
  - verify email
  - forgot/reset password
  - order created
- Verificar remitente (`mail_from_name`, `mail_from_address`)

## 6) QA funcional mínima pre-deploy

- Registro / Login / Logout
- Verificación de correo
- Recuperación de contraseña
- Tienda / filtros / detalle
- Carrito / checkout
- Mis pedidos / detalle
- Mis reparaciones / detalle
- Admin dashboard
- Admin pedidos / cambio de estado
- Admin reparaciones / edición + estado
- Admin productos/categorías
- Admin usuarios/roles
- Settings / Mail templates / WhatsApp / Ayuda

## 7) Operación y soporte

- Logs de API activos
- Plan de backup DB
- Runbooks de backup/restore y primer arranque listos
- Usuario admin inicial validado

## 8) Comandos útiles

- `npm run env:check`
- `npm run deploy:check`
- `npm run db:check`
- `npm run db:migrate`
- `npm run qa:migration:close`
- `npm run qa:preprod`
