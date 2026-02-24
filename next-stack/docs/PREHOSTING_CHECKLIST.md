# Pre-Hosting Checklist (Next Stack)

Checklist práctica para dejar `next-stack` listo antes de deploy.

## 1. Entorno local (obligatorio)

- `npm run env:check`
- `npm run db:check`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run qa`
- `npm run qa:backend:full`

## 2. Variables de entorno (producción)

Revisar y cambiar:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET` (largo y único)
- `JWT_REFRESH_SECRET` (largo y único)
- `WEB_URL` (dominio real)
- `API_URL` (dominio/subdominio real de API)
- `VITE_API_URL` (normalmente igual a `API_URL`)
- `CORS_ORIGINS` (restringido a tus dominios)

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

## 7. Operación y soporte

- Logs de aplicación activos (API)
- Plan de backup DB
- Usuario admin inicial validado
- Procedimiento de rollback definido

## 8. Comandos útiles

- `npm run env:check`
- `npm run db:check`
- `npm run qa`
- `npm run qa:backend:full`
