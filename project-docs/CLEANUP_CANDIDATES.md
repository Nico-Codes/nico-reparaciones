# CLEANUP_CANDIDATES

> Estado tras Fase 3: este documento conserva candidatos activos y resoluciones ya ejecutadas para mantener trazabilidad. Lo resuelto se deja marcado como historial, no como trabajo pendiente.

## Codigo posiblemente muerto

### 1. `next-stack/apps/web/src/features/admin/AdminSettingsPage.tsx`
- Estado: resuelto en Fase 3.
- Evidencia usada: `rg` sin referencias fuera del propio archivo.
- Accion ejecutada: eliminado.
- Riesgo ejecutado: medio, mitigado por busqueda global y typecheck posterior.

### 2. `next-stack/apps/web/src/features/repairs/AdminRepairsPage.tsx`
- Estado: resuelto en Fase 3.
- Evidencia usada: la ruta real usa `AdminRepairsListPage.tsx`; `rg` sin referencias vivas al archivo alternativo.
- Accion ejecutada: eliminado.
- Riesgo ejecutado: medio, mitigado por busqueda global y typecheck posterior.

### 3. `next-stack/apps/web/src/features/auth/AuthStatusCard.tsx`
- Estado: resuelto en Fase 3.
- Evidencia usada: `rg` sin referencias vivas en router ni componentes auditados.
- Accion ejecutada: eliminado.
- Riesgo ejecutado: medio, mitigado por busqueda global y typecheck posterior.

## Assets potencialmente obsoletos o duplicados

### 4. `public/brand`, `public/brand-assets`, `public/icons`, `public/img`
- Por que parece candidato: existen duplicados equivalentes en `next-stack/apps/web/public/*`.
- Riesgo: alto
- Requiere validacion antes de eliminar: si
- Nota: todavia pueden ser fuente para legacy o scripts de migracion.

### 5. `next-stack/apps/web/public/img`
- Por que parece candidato: confirmar si todo el contenido sigue referenciado o si parte se copio por paridad visual sin uso actual.
- Riesgo: medio
- Requiere validacion antes de eliminar: si

### 5b. `next-stack/apps/web/public/manifest.webmanifest`
- Estado: resuelto en Fase 3.
- Evidencia usada: el nuevo stack referencia `site.webmanifest`; `manifest.webmanifest` solo seguia apareciendo en el legacy root.
- Accion ejecutada: eliminado.
- Riesgo ejecutado: medio.

## Configs legacy o duplicadas

### 6. `next-stack/apps/api/.env`
- Estado: resuelto en Fase 3.
- Evidencia usada: `env-check`, scripts Prisma, `vite.config.ts`, `load-canonical-env.ts`, `main.ts` y `app.module.ts` quedaron apuntando al canon `next-stack/.env`.
- Accion ejecutada: eliminado.
- Riesgo ejecutado: medio, mitigado por unificacion previa del runtime y validaciones posteriores.

### 7. Duplicacion de `dotenv-cli` en `next-stack/apps/api/package.json`
- Estado: resuelto en Fase 3.
- Evidencia usada: `package.json` tenia dos claves; el lockfile resolvia `7.4.4`.
- Accion ejecutada: se elimino la clave duplicada y se mantuvo la version alineada al lockfile.
- Riesgo ejecutado: medio.

## Scripts duplicados o dudosos

### 8. `scripts/e2e-critical.mjs` y `scripts/e2e-serve.mjs` en raiz
- Por que parece candidato: revisar si siguen siendo solo del legacy o si conviven con QA nueva en `next-stack/scripts`.
- Riesgo: medio
- Requiere validacion antes de eliminar: si

### 9. Scripts `migrate-legacy-*` en `next-stack/apps/api/prisma`
- Por que parece candidato: son utiles para migracion, pero puede no ser necesario conservarlos indefinidamente una vez congelado el legacy.
- Riesgo: alto
- Requiere validacion antes de eliminar: si

## Documentacion redundante o superpuesta

### 10. `docs/PREHOSTING_CHECKLIST.md` vs `next-stack/docs/PREHOSTING_CHECKLIST.md`
- Por que parece candidato: mismo nombre, alcance potencialmente distinto, alta probabilidad de confusion.
- Riesgo: medio
- Requiere validacion antes de eliminar/unificar: si

### 11. `docs/CONOCIMIENTO_COMPLETO_NICOREPARACIONES.txt`
- Por que parece candidato: ahora existe una nueva capa documental en `project-docs/` que deberia pasar a ser fuente viva principal.
- Riesgo: bajo
- Requiere validacion antes de mover/deprecar: si

### 12. `README.md` root
- Por que parece candidato: sigue siendo basicamente un README de Laravel y no refleja el estado operativo actual del repo mixto.
- Riesgo: bajo
- Requiere validacion antes de reemplazar: si

## Carpetas historicas

### 13. `app/`, `bootstrap/`, `config/`, `resources/`, `routes/`, `tests/` root
- Por que parece candidato: son la base del legacy, no del stack operativo actual.
- Riesgo: alto
- Requiere validacion antes de tocar: si
- Nota: no se deben tratar como basura. Pueden seguir siendo necesarios para QA visual, referencia y contingencia.

### 14. PDFs historicos en raiz
- `NicoReparaciones_Documentacion_historica_2025-12-12.pdf`
- `NicoReparaciones_Documentacion_historica_2025-12-12_v2.pdf`
- Por que parecen candidatos: documentacion historica no integrada al flujo tecnico actual.
- Riesgo: bajo
- Requiere validacion antes de eliminar: si

## Dependencias sospechosas o a revisar

### 15. `laravel/socialite` en legacy
- Por que parece candidato: el nuevo frontend tiene rutas `/auth/google*` pero hoy solo redirigen a login; no se confirmo flujo real de social auth en next-stack.
- Riesgo: alto
- Requiere validacion antes de decidir retiro: si

### 16. `predis/predis` en legacy
- Por que parece candidato: revisar si sigue usandose en operaciones reales del root o si quedo como arrastre del stack anterior.
- Riesgo: medio
- Requiere validacion antes de eliminar: si

## Generados, logs y artefactos

### 17. `playwright-report/`, `test-results/`, `next-stack/artifacts/`, `next-stack/.dev-logs/`, `next-stack/.qa-*.log`, `next-stack/api-dev.log`
- Estado: resuelto parcialmente en Fase 3.
- Accion ejecutada:
  - eliminados `playwright-report/`, `test-results/`, `next-stack/artifacts/`, `next-stack/.qa-*.log`, `next-stack/api-dev.log`, `.qa_api_pid`, `.phpunit.result.cache`
  - `next-stack/.dev-logs/` quedo pendiente por locks del sistema operativo sobre `api.log` y `web.log`
- Riesgo ejecutado: bajo.
- Nota: en general estan ignorados por git y son regenerables.

### 18. `database/database.sqlite`, `database/e2e.sqlite`, `database/legacy-visual-parity.sqlite`
- Por que parecen candidatos: bases SQLite de soporte, test o fallback visual.
- Riesgo: medio
- Requiere validacion antes de eliminar: si

## Archivos dudosos puntuales

### 19. `tmp_evophone_product.html`
- Estado: resuelto en Fase 3.
- Evidencia usada: `rg` sin referencias.
- Accion ejecutada: eliminado.
- Riesgo ejecutado: bajo.

### 20. archivo `npm` vacio en raiz
- Estado: resuelto en Fase 3.
- Evidencia usada: archivo vacio, `rg` sin dependencias funcionales.
- Accion ejecutada: eliminado.
- Riesgo ejecutado: bajo.

## Riesgos generales de limpieza

- romper scripts de migracion que todavia leen datos/archivos del legacy
- romper QA visual legacy vs next
- borrar assets duplicados sin haber fijado fuente canonica
- eliminar partes del root Laravel sin una politica de cuarentena o retiro gradual
- mezclar limpieza documental con runbooks operativos vigentes

## Regla para la siguiente fase

Toda limpieza futura debe seguir esta secuencia:

1. confirmar referencias con busqueda global
2. clasificar impacto funcional, QA y documental
3. validar con humano si el elemento es historico o prescindible
4. borrar en bloques chicos y verificables
5. correr QA minima despues de cada bloque
