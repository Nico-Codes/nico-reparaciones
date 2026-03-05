# Deploy Guide (VPS Ubuntu + Nginx + PM2 + PostgreSQL)

Guía práctica para desplegar `next-stack` cuando decidas salir de local.

## 1. Arquitectura recomendada

- `Nginx` como reverse proxy (HTTPS)
- `Node.js` para:
  - API NestJS (`@nico/api`)
  - frontend web servido como archivos estáticos (recomendado)
- `PM2` para proceso API
- `PostgreSQL` (local en VPS o administrado externo)

## 2. Requisitos recomendados del VPS

- Ubuntu 22.04 LTS o 24.04 LTS
- 2 vCPU
- 2 GB RAM (mínimo usable)
- 20+ GB SSD
- Latencia razonable con tu zona de operación

## 3. Instalación base del servidor

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx ufw
```

### Node.js LTS (ejemplo: 22.x)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### PM2

```bash
sudo npm install -g pm2
pm2 -v
```

## 4. PostgreSQL

### Opción A (recomendada): PostgreSQL administrado
- Usar proveedor externo (mejor backups/operación)
- Configurar `DATABASE_URL` con TLS si aplica

### Opción B: PostgreSQL en el VPS

```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql
```

Crear DB/usuario:

```sql
CREATE USER nico_app WITH PASSWORD 'CAMBIAR_ESTA_CLAVE';
CREATE DATABASE nico_reparaciones_next OWNER nico_app;
GRANT ALL PRIVILEGES ON DATABASE nico_reparaciones_next TO nico_app;
```

## 5. Subir el proyecto

```bash
cd /var/www
sudo mkdir -p nico-reparaciones
sudo chown $USER:$USER nico-reparaciones
cd nico-reparaciones
git clone <TU_REPO_GITHUB> .
cd next-stack
npm install
```

## 6. Variables de entorno (producción)

Crear archivo:

```bash
cp .env.production.example .env.production
nano .env.production
```

Completar como mínimo:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `WEB_URL`
- `API_URL`
- `VITE_API_URL`
- `CORS_ORIGINS`
- `MAIL_PREVIEW_TOKENS=0`
- `ALLOW_ADMIN_BOOTSTRAP=0`

Validar:

```bash
npm run deploy:check
```

## 7. Build y migraciones (producción)

```bash
npm run build
npm run db:migrate:deploy
```

Seed:
- En producción real, evitar seed demo completo.
- Si necesitás seed inicial controlado, crear uno específico (`seed:prod:init`) más adelante.

## 8. Ejecutar API con PM2

Desde `next-stack/`:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Ver logs:

```bash
pm2 logs nico-api
```

Tambien podes usar el comando directo (sin ecosystem):

```bash
pm2 start npm --name nico-api -- run start:prod:api
```

## 9. Frontend web (recomendado: servir estático con Nginx)

Construir frontend:

```bash
npm run build --workspace @nico/web
```

Publicar carpeta estática:

```bash
sudo mkdir -p /var/www/nico-web
sudo rsync -av --delete apps/web/dist/ /var/www/nico-web/
```

## 10. Nginx (frontend + proxy API)

Crear config:

```bash
sudo nano /etc/nginx/sites-available/nico-reparaciones
```

Ejemplo (ajustar dominios):

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    root /var/www/nico-web;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activar:

```bash
sudo ln -s /etc/nginx/sites-available/nico-reparaciones /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 11. HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

## 12. Firewall básico

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## 13. QA post-deploy (mínimo)

- `GET https://api.tu-dominio.com/api/health`
- Login
- Tienda / carrito / checkout
- Admin dashboard
- Correos (verify/reset/order)

## 14. Operación / mantenimiento

- Backup DB diario
- Rotación de logs PM2 / sistema
- Monitoreo de uso RAM/CPU
- Actualización controlada:
  - `git pull`
  - `npm install`
  - `npm run build`
  - `npm run db:migrate:deploy`
  - `pm2 restart nico-api`
  - `rsync` de `apps/web/dist/`

## 15. Notas para tu proyecto actual (importante)

- En local estás usando PostgreSQL 12 con fallback `db:push`.
- Para producción conviene PostgreSQL moderno (14/15/16+) para usar migraciones Prisma (`db:migrate:deploy`) sin problemas.
- No dejar `ALLOW_ADMIN_BOOTSTRAP=1` ni `MAIL_PREVIEW_TOKENS=1` en producción.



Ver runbooks:

- Backup/restore: `docs/BACKUP_RESTORE_RUNBOOK.md`
- Primer arranque: `docs/FIRST_START_RUNBOOK.md`
