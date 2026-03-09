# CANONICAL_SOURCES

## Objetivo

Definir fuentes canonicas y no canonicas del repositorio para evitar duplicacion, drift y limpiezas ciegas.

## 1. Codigo operativo canonico

### Canonico
- `next-stack/apps/web`
- `next-stack/apps/api`
- `next-stack/packages/contracts`

### Regla
- Toda feature nueva debe nacer en `next-stack/`.
- La raiz Laravel no es fuente operativa para desarrollo nuevo.

## 2. Assets visuales canonicos

### Canonico
- `next-stack/apps/web/public`

### No canonico
- `public/` root = mirror de compatibilidad legacy.
- `storage/app/public` y `public/storage` = fallback historico, no fuente primaria.

## 3. Entorno/configuracion canonica

### Canonico
- `next-stack/.env`
- `next-stack/.env.example`
- `next-stack/.env.production.example`

## 4. Documentacion viva canonica

### Canonico
- `project-docs/`

### Complementario
- `next-stack/docs/` = runbooks y docs operativas del nuevo stack

### Historico
- `docs/` root
- `docs/CONOCIMIENTO_COMPLETO_NICOREPARACIONES.txt`

## 5. Legacy support transitorio

### Activo
- `next-stack/legacy-support/assets/`

### Deprecated
- `next-stack/legacy-support/deprecated/`

### Regla
- no volver a mezclar tooling deprecated dentro de carpetas operativas del nuevo stack.
- `legacy:parity:deprecated` y `legacy:migrate:*:deprecated` no forman parte del flujo normal.
