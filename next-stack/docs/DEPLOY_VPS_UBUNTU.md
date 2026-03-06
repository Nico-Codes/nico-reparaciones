# Deploy Guide (VPS Ubuntu + Nginx + PM2 + PostgreSQL)

Guía práctica para desplegar `next-stack` en producción.

## 1) Arquitectura recomendada

- `Nginx` como reverse proxy (HTTPS)
- API NestJS (`@nico/api`) detrás de PM2
- Frontend React servido como estático (`apps/web/dist`)
- PostgreSQL (local o administrado)

## 2) Requisitos mínimos VPS

- Ubuntu 22.04/24.04 LTS
- 2 vCPU
- 2 GB RAM (mínimo)
- 20+ GB SSD

## 3) Base del servidor

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx ufw
```

### Node.js LTS (ejemplo 22.x)

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

## 4) PostgreSQL

### Opción A (recomendada): administrado

- Usar proveedor externo (backup/operación más simple)
- Configurar `DATABASE_URL` con TLS si corresponde

### Opción B: en VPS

```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql
```

```sql
CREATE USER nico_app WITH PASSWORD 'CAMBIAR_ESTA_CLAVE';
CREATE DATABASE nico_reparaciones_next OWNER nico_app;
GRANT ALL PRIVILEGES ON DATABASE nico_reparaciones_next TO nico_app;
```

## 5) Subir proyecto

```bash
cd /var/www
sudo mkdir -p nico-reparaciones
sudo chown $USER:$USER nico-reparaciones
cd nico-reparaciones
git clone <TU_REPO_GITHUB> .
cd next-stack
npm install
```

## 6) Variables de entorno (producción)

```bash
cp .env.production.example .env.production
nano .env.production
```

Completar al menos:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `WEB_URL`
- `API_URL`
- `VITE_API_URL`
- `CORS_ORIGINS`
- `MAIL_PREVIEW_TOKENS=0`
- `ALLOW_ADMIN_BOOTSTRAP=0`
- `ALLOW_DEMO_SEED=0`

Validar:

```bash
npm run deploy:check
```

## 7) Gate final de migración antes de deploy

```bash
npm run qa:migration:close
```

Incluye:
- backend full
- route parity
- e2e frontend
- auditoría visual admin
- parity visual legacy vs next
- auditoría responsive (desktop/tablet/mobile)
- chequeo de desacople legacy

## 8) Build + migraciones

```bash
npm run build
npm run db:migrate:deploy
```

Nota:
- Evitar seed demo en producción.
- Si necesitás seed inicial, usar uno controlado para prod.

## 9) API con PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
pm2 logs nico-api
```

## 10) Frontend estático

```bash
npm run build --workspace @nico/web
sudo mkdir -p /var/www/nico-web
sudo rsync -av --delete apps/web/dist/ /var/www/nico-web/
```

## 11) Nginx

`/etc/nginx/sites-available/nico-reparaciones`

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

```bash
sudo ln -s /etc/nginx/sites-available/nico-reparaciones /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 12) HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

## 13) Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## 14) QA post-deploy mínimo

- `GET /api/health`
- login admin/user
- tienda/carrito/checkout
- admin dashboard
- mails (verify/reset/order)

## 15) Operación

- Backup DB diario
- Monitoreo RAM/CPU
- Rotación de logs
- Update controlado:
  - `git pull`
  - `npm install`
  - `npm run qa:migration:close`
  - `npm run build`
  - `npm run db:migrate:deploy`
  - `pm2 restart nico-api`
  - `rsync apps/web/dist`

## 16) Referencias

- `docs/BACKUP_RESTORE_RUNBOOK.md`
- `docs/FIRST_START_RUNBOOK.md`
- `docs/PREHOSTING_CHECKLIST.md`
