# Railway Deploy Runbook

Runbook inicial para desplegar `next-stack` en Railway con arquitectura todo en uno. No reemplaza la validacion previa del repo ni autoriza deploy sin revisar variables reales.

## 1. Arquitectura objetivo

- Proyecto Railway unico para NicoReparaciones.
- Servicio `web`: frontend React/Vite.
- Servicio `api`: backend NestJS/Node.
- Servicio `postgres`: PostgreSQL administrado por Railway.
- Railway Volume montado en el backend para uploads persistentes.
- Dominio gratuito Railway al inicio; dominio propio queda para una etapa posterior.
- Auth propia actual del sistema.
- SMTP externo para envio real de mails.
- WhatsApp Cloud API solo si las credenciales estan configuradas.

## 2. Servicios esperados

| Servicio | Tipo | Uso |
| --- | --- | --- |
| `web` | Node/Vite preview | Servir `apps/web/dist` |
| `api` | Node/NestJS | API, auth, admin, tienda, reparaciones, uploads |
| `postgres` | Railway PostgreSQL | Base de datos principal |
| `nico-public` | Railway Volume | Archivos subidos y assets persistentes |

## 3. Root directories

- Servicio `web`: root directory `next-stack`.
- Servicio `api`: root directory `next-stack`.
- PostgreSQL: plugin/servicio administrado Railway.
- Volume: montado en el servicio `api`.

Usar root `next-stack` mantiene disponibles `package-lock.json`, workspaces y `packages/contracts`.

## 4. Build commands

### Web

```bash
npm ci
npm run build --workspace @nico/web
```

### API

```bash
npm ci
npm run build --workspace @nico/api
```

No ejecutar migraciones como parte automatica del build.

## 5. Start commands

### Web

```bash
npm exec --workspace @nico/web -- vite preview --host 0.0.0.0 --port $PORT
```

### API

```bash
npm run start:prod --workspace @nico/api
```

La API lee `PORT` desde entorno. Railway debe inyectarlo en runtime.

## 6. Variables de entorno esperadas

### API

- `DATABASE_URL`: URL PostgreSQL provista por Railway.
- `NODE_ENV=production`.
- `PORT`: puerto inyectado por Railway.
- `WEB_URL`: URL publica del servicio `web`.
- `API_URL`: URL publica del servicio `api`.
- `CORS_ORIGINS`: origenes permitidos, separados por coma. Debe incluir `WEB_URL`.
- `JWT_ACCESS_SECRET`: secreto largo y unico, minimo 32 caracteres.
- `JWT_REFRESH_SECRET`: secreto largo y unico, minimo 32 caracteres.
- `WEB_PUBLIC_DIR=/data/nico-public`.
- `TRUST_PROXY=1`.
- `MAIL_PREVIEW_TOKENS=0`.
- `ALLOW_ADMIN_BOOTSTRAP=0` despues del bootstrap inicial.
- `ALLOW_DEMO_SEED=0`.

### Web

- `NODE_ENV=production`.
- `VITE_API_URL`: URL publica del servicio `api`.

### SMTP externo

- `SMTP_HOST`.
- `SMTP_PORT`.
- `SMTP_USER`.
- `SMTP_PASS`.
- `SMTP_SECURE` (`1` para 465, `0` para 587/starttls).

Tambien validar desde admin que existan `mail_from_name` y `mail_from_address`.

### WhatsApp Cloud API, si aplica

- `WHATSAPP_CLOUD_ENABLED`.
- `WHATSAPP_CLOUD_ACCESS_TOKEN`.
- `WHATSAPP_CLOUD_PHONE_NUMBER_ID`.
- `WHATSAPP_CLOUD_VERIFY_TOKEN`.
- `WHATSAPP_CLOUD_API_VERSION`.
- `WHATSAPP_CLOUD_BASE_URL`.

Si WhatsApp no queda listo, mantener `WHATSAPP_CLOUD_ENABLED=0` y usar el flujo manual asistido.

## 7. Volume para uploads

- Crear Railway Volume para el servicio `api`.
- Mount path recomendado: `/data/nico-public`.
- Definir `WEB_PUBLIC_DIR=/data/nico-public` en el servicio `api`.
- No usar filesystem efimero para uploads, branding, imagenes de productos ni archivos cargados por admin.
- Antes de habilitar carga real de archivos, probar que un upload persiste tras redeploy y queda servido desde URL publica.

Riesgo a validar antes del deploy real: el directorio persistente usado por `WEB_PUBLIC_DIR` debe ser tambien el directorio servido por la API para `/storage`, `/brand-assets`, `/icons` y recursos publicos equivalentes.

## 8. Healthcheck

- Endpoint recomendado para readiness: `/api/health/ready`.
- Railway debe considerar exitoso HTTP 200.
- Si falla, revisar conexion PostgreSQL y `DATABASE_URL`.

## 9. Checklist antes del deploy

- Confirmar repo limpio y rama esperada.
- Revisar `project-docs/DECISIONS_LOG.md` y este runbook.
- Confirmar que no hay migraciones pendientes sin decision.
- Preparar secretos reales para JWT, SMTP y WhatsApp si aplica.
- Crear servicios Railway `web`, `api`, `postgres` y volume.
- Configurar variables por servicio, sin placeholders.
- Revisar `CORS_ORIGINS` contra la URL real del frontend.
- Confirmar que `ALLOW_ADMIN_BOOTSTRAP` solo se habilita temporalmente si hace falta crear admin.

## 10. Checklist durante el deploy

- Deployar `postgres`.
- Deployar `api` con `DATABASE_URL` y variables de produccion.
- Ejecutar migraciones de forma controlada con `npm run db:migrate:deploy --workspace @nico/api` solo cuando el operador lo autorice.
- Deployar `web` con `VITE_API_URL` apuntando al `api`.
- Revisar logs de build y runtime.
- Verificar `/api/health/ready`.
- Confirmar que no aparecen errores de CORS desde el navegador.

## 11. Checklist despues del deploy

- Revisar healthcheck de API.
- Abrir frontend en dominio Railway.
- Confirmar login y sesion con cookies seguras.
- Confirmar acceso admin.
- Revisar carga de productos y detalle.
- Probar upload de imagen/asset y persistencia.
- Probar pedido completo.
- Probar flujo de reparaciones.
- Enviar prueba SMTP desde admin.
- Probar WhatsApp si `WHATSAPP_CLOUD_ENABLED=1`.
- Desactivar `ALLOW_ADMIN_BOOTSTRAP` si se uso.
- Registrar hallazgos y ajustes en `CHANGELOG_AI.md` y documentos impactados.

## 12. Pruebas minimas

- Login de usuario/admin.
- Panel admin.
- Productos: listado, detalle y carga desde admin.
- Uploads: imagen de producto o asset de branding, con persistencia tras redeploy.
- Pedidos: carrito, checkout y estado de pedido.
- Reparaciones: alta, detalle, cambio de estado y consulta publica.
- Mail SMTP: prueba desde admin y mail real recibido.
- WhatsApp: prueba solo si esta configurado; si no, validar fallback manual asistido.

## 13. Notas operativas

- Mantener Railway todo en uno mientras sea la opcion mas simple.
- Si crecen costos, trafico, almacenamiento o necesidades de control, reevaluar VPS o separacion de servicios.
- No subir secrets al repo.
- No depender de builds locales para produccion; Railway debe construir desde comandos declarados.
