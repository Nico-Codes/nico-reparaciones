# CANONICAL_SOURCES

## Objetivo

Definir fuentes canónicas y no canónicas del repositorio para que futuras limpiezas, consolidaciones y deploys se hagan con criterio consistente.

## 1. Fuente canónica de código operativo

### Canónica
- `next-stack/apps/web`
- `next-stack/apps/api`
- `next-stack/packages/contracts`

### Evidencia
- El frontend real se monta desde `next-stack/apps/web/src/App.tsx`.
- El backend real arranca desde `next-stack/apps/api/src/main.ts` y carga módulos desde `next-stack/apps/api/src/modules/app.module.ts`.
- Los scripts QA de cierre (`next-stack/package.json`) apuntan al monorepo `next-stack/`.

### Regla
- Toda mejora funcional nueva debe partir del código en `next-stack/`.
- La raíz Laravel no debe considerarse fuente de verdad operativa para features nuevas.

## 2. Fuente canónica de assets visuales

### Canónica recomendada
- `next-stack/apps/web/public`

### Evidencia
- `next-stack/apps/api/src/main.ts` sirve assets estáticos resolviendo `apps/web/public`.
- `next-stack/apps/api/src/modules/admin/admin.service.ts` y `next-stack/apps/api/src/modules/catalog-admin/catalog-admin.service.ts` escriben y resuelven `apps/web/public`.
- `next-stack/apps/web/index.html` consume favicons y el manifest operativo desde la raíz pública de la app React.
- `next-stack/apps/api/prisma/migrate-legacy-visual-assets.ts` copia desde el legacy hacia `next-stack/apps/web/public`.
- Comparación real de archivos al 2026-03-06:
  - `public/brand` y `next-stack/apps/web/public/brand`: mismos 2 archivos, mismo hash.
  - `public/brand-assets` y `next-stack/apps/web/public/brand-assets`: mismos 2 archivos, mismo hash.
  - `public/icons` y `next-stack/apps/web/public/icons`: mismos 9 archivos, mismo hash.
  - `public/img` y `next-stack/apps/web/public/img`: mismo archivo, mismo hash.
  - `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, `apple-touch-icon.png`, `site.webmanifest`: presentes en ambos lados y con el mismo hash.
- `next-stack/apps/web/public/manifest.webmanifest` se retiró en Fase 3; el stack nuevo usa `site.webmanifest`.

### No canónica / histórica
- `public/` en raíz queda como espejo histórico y fuente de referencia temporal.
- Subárboles legacy no usados por el nuevo stack pero aún presentes:
  - `public/build`
  - `public/css`
  - `public/index.php`
  - `public/robots.txt`
  - `public/.htaccess`

### Regla
- Cualquier upload, reset o branding nuevo debe consolidarse en `next-stack/apps/web/public`.
- El root `public/` no debe modificarse como fuente primaria salvo tareas de referencia/migración histórica.

## 3. Fuente canónica de configuración y entorno

### Canónica recomendada
- `next-stack/.env`
- plantillas: `next-stack/.env.example`, `next-stack/.env.production.example`

### Evidencia
- `next-stack/scripts/env-check.mjs` lee `next-stack/.env` y advierte si aparece `apps/api/.env`.
- Los scripts Prisma en `next-stack/apps/api/package.json` usan `dotenv -e ../../.env`, o sea `next-stack/.env`.
- `next-stack/scripts/deploy-check.mjs` usa `.env.production` o `.env` desde la raíz de `next-stack`.
- `next-stack/apps/api/src/load-canonical-env.ts` centraliza la carga de variables y excluye explícitamente `apps/api/.env`.
- `next-stack/apps/api/src/main.ts` y `next-stack/apps/api/src/modules/app.module.ts` cargan el canon antes de inicializar el runtime.
- `next-stack/apps/web/vite.config.ts` define `envDir` apuntando a la raíz de `next-stack`.
- Los scripts de Prisma y migración (`db-check.ts`, `migrate-legacy-*.ts`, `fix-mojibake.ts`, `seed.ts`) ya fueron alineados al helper canónico.

### Estado actual
- `next-stack/.env` es la única fuente viva operativa.
- `next-stack/apps/api/.env` fue retirado en Fase 3 para eliminar duplicación ambigua.

### Regla
- Usar `next-stack/.env` como única fuente viva.
- No recrear `next-stack/apps/api/.env`; si aparece, debe tratarse como drift y corregirse.

## 4. Fuente canónica de documentación viva

### Canónica recomendada
- `project-docs/`

### Rol complementario
- `next-stack/docs/`: runbooks y documentación operativa del nuevo stack.

### Rol histórico / no canónico
- `docs/` de raíz: documentación heredada/general aún útil como referencia, pero no debe ser la fuente viva principal para gobernanza técnica.
- `docs/CONOCIMIENTO_COMPLETO_NICOREPARACIONES.txt`: documento maestro base de contexto, útil como snapshot, no como fuente única de verdad futura.

### Regla
- Decisiones, canonización, auditorías y cleanup deben registrarse en `project-docs/`.
- Runbooks de ejecución o deploy del nuevo stack deben quedar en `next-stack/docs/`.

## 5. Fuente histórica / no canónica

Se consideran históricas o de soporte transitorio:
- raíz Laravel (`app/`, `resources/`, `routes/`, `config/`, `database/`, `public/`, `storage/`, `bootstrap/`)
- scripts `migrate-legacy-*`
- `qa-visual-parity.mjs`
- assets duplicados del root legacy
- documentación operativa legacy en `docs/`

## 6. Reglas para futuras consolidaciones

- No mover ni eliminar fuentes históricas sin:
  - búsqueda global de referencias
  - clasificación de riesgo
  - validación humana si el riesgo no es bajo
  - actualización de `project-docs/DECISIONS_LOG.md`
- Antes de consolidar assets, confirmar que:
  - `qa:visual-parity` ya no depende del root legacy, o fue reemplazado
  - no queden scripts leyendo `public/` root o `storage/` legacy
- Antes de consolidar env, confirmar que:
  - todos los scripts usan `next-stack/.env`
  - no existe operador que dependa de `apps/api/.env`
- Antes de reintroducir documentación o assets duplicados, confirmar que no se está revirtiendo una consolidación ya cerrada.
