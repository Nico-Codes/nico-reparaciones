# LEGACY_RETIREMENT_PLAN

## Objetivo

Definir un retiro ordenado del soporte legacy restante sin mezclar runtime canonico con herramientas historicas.

## Estado despues de Fase 4F

- Google auth legacy: retirado.
- `laravel/socialite`: retirado.
- `public/` root: mirror legacy, no canon.
- parity visual legacy: deprecated y fuera del gate principal.
- migradores legacy: deprecated y fuera del flujo normal.
- soporte legacy activo real: compatibilidad de assets y existencia del root Laravel historico.

## Orden recomendado de retiro

### Etapa 1. Retiro efectivo de tooling deprecated
1. validar con humano que no se necesitan rescates adicionales desde legacy
2. eliminar `next-stack/legacy-support/deprecated/api/*`
3. eliminar `next-stack/legacy-support/deprecated/qa/qa-visual-parity.mjs`
4. eliminar `next-stack/legacy-support/deprecated/sqlite/legacy-visual-parity.sqlite`

Bloquea:
- limpieza fuerte del repo legacy con menos ambiguedad

### Etapa 2. Retiro de duplicados root y mirrors
1. confirmar que `public/` root ya no se necesita ni siquiera como mirror
2. retirar duplicados de `public/` root
3. retirar fallback historico de `storage/app/public` y `public/storage` si sigue vacio

### Etapa 3. Composer/runtime residual del root
1. auditar `predis/predis`
2. decidir si el root Laravel debe quedar archivado o retirado
3. revisar si `tests/`, `e2e/`, `scripts/`, `tools/` del root conservan algun valor

### Etapa 4. Retiro final del root
Prerequisitos minimos:
- sin tooling deprecated vivo
- sin dependencia real de `public/` root
- composer residual auditado
- decision humana explicita sobre archivo o retiro total

## Bloqueadores actuales del retiro final

- existencia del runtime legacy root como contexto historico
- assets duplicados del root todavia presentes
- decision pendiente sobre `predis/predis`
- residuos de esquema legacy no prioritarios
