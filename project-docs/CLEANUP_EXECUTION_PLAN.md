# CLEANUP_EXECUTION_PLAN

## Objetivo

Preparar y registrar una limpieza segura, trazable y escalonada. Tras la Fase 3, este documento mantiene el orden futuro y marca lo ya ejecutado.

## Reglas de ejecución

- No eliminar nada sin registrar el cambio en `CHANGELOG_AI.md`.
- Toda limpieza debe dejar evidencia en `project-docs/DECISIONS_LOG.md` si afecta fuentes canónicas, rutas, assets, env o soporte legacy.
- Toda fase debe partir con baseline técnico:
  - `npm run qa:migration:close` en `next-stack`
  - backup o commit previo
  - búsqueda de referencias (`rg`)

## Clasificación de riesgo

### Bajo riesgo
Cambios que, tras una verificación de referencias, no deberían afectar runtime ni QA principal.

1. `npm`
- Ubicación: `npm`
- Motivo: archivo raíz vacío, sin función aparente.
- Prerrequisitos: confirmar 0 referencias.
- Validación: `rg -n "\bnpm\b"` solo documental si aplica.
- Aprobación humana: recomendada, no estrictamente necesaria si sigue sin referencias.
- Estado Fase 3: ejecutado.

2. `tmp_evophone_product.html`
- Ubicación: `tmp_evophone_product.html`
- Motivo: artefacto temporal fuera de estructura del proyecto.
- Prerrequisitos: confirmar 0 referencias.
- Validación: búsqueda global por nombre.
- Aprobación humana: no obligatoria si no tiene referencias.
- Estado Fase 3: ejecutado.

3. Artefactos de ejecución no versionados
- Ubicación: `api-dev.log`, `.qa-*.log`, `playwright-report/`, `test-results/`, `.dev-logs/`, `next-stack/artifacts/`
- Motivo: outputs de desarrollo/QA.
- Prerrequisitos: confirmar política de regeneración y `.gitignore`.
- Validación: verificar que no formen parte de evidencia que se quiera conservar fuera del repo.
- Aprobación humana: no obligatoria para limpieza local; sí si se desea borrar evidencia histórica relevante.
- Estado Fase 3: ejecutado parcialmente; `.dev-logs/` quedó pendiente por archivos bloqueados por procesos activos.

## Medio riesgo
Cambios con impacto posible en tooling, documentación o compatibilidad secundaria.

4. `next-stack/apps/api/.env`
- Ubicación: `next-stack/apps/api/.env`
- Motivo: duplicación ambigua frente a `next-stack/.env`.
- Prerrequisitos:
  - validar que todos los scripts usen `next-stack/.env`
  - comunicar al equipo la fuente canónica
- Validación:
  - `npm run env:check`
  - scripts Prisma y smoke en verde
- Aprobación humana: sí.
- Estado Fase 3: ejecutado.

5. `next-stack/apps/web/public/manifest.webmanifest`
- Ubicación: `next-stack/apps/web/public/manifest.webmanifest`
- Motivo: archivo extra no referenciado; la app usa `site.webmanifest`.
- Prerrequisitos: confirmar 0 referencias en runtime y docs activas.
- Validación: búsqueda global + revisión de `index.html` y `BrandingHeadSync.tsx`.
- Aprobación humana: sí.
- Estado Fase 3: ejecutado.

6. Componentes frontend no referenciados
- Ubicación:
  - `next-stack/apps/web/src/features/admin/AdminSettingsPage.tsx`
  - `next-stack/apps/web/src/features/repairs/AdminRepairsPage.tsx`
  - `next-stack/apps/web/src/features/auth/AuthStatusCard.tsx`
- Motivo: sin referencias detectadas por búsqueda estática actual.
- Prerrequisitos: confirmar que no se usan por import dinámico manual ni reserva intencional.
- Validación: `rg` + revisión humana.
- Aprobación humana: sí.
- Estado Fase 3: ejecutado.

7. Documentación redundante
- Ubicación: `docs/`, `next-stack/docs/`, `docs/CONOCIMIENTO_COMPLETO_NICOREPARACIONES.txt`
- Motivo: coexistencia de capas documentales con superposición parcial.
- Prerrequisitos: definir política de documentación canónica.
- Validación: mantener índices o referencias cruzadas antes de retirar nada.
- Aprobación humana: sí.

8. Duplicidad en `dotenv-cli`
- Ubicación: `next-stack/apps/api/package.json`
- Motivo: dos versiones declaradas del mismo paquete en `devDependencies`.
- Prerrequisitos: revisar lockfile y resolución efectiva.
- Validación: `npm install`, `npm run db:check`, `npm run qa:backend:full`.
- Aprobación humana: sí.
- Estado Fase 3: ejecutado.

9. SQLite de soporte local
- Ubicación:
  - `database/database.sqlite`
  - `database/e2e.sqlite`
  - `database/legacy-visual-parity.sqlite`
- Motivo: parecen artefactos locales, pero al menos `legacy-visual-parity.sqlite` tiene uso explícito en `qa-visual-parity.mjs`.
- Prerrequisitos: definir política local reproducible.
- Validación: ejecutar QA que dependa de ellos.
- Aprobación humana: sí.

## Alto riesgo
Cambios que pueden romper compatibilidad, soporte histórico o flujos de QA/migración.

10. Scripts `migrate-legacy-*`
- Ubicación:
  - `next-stack/apps/api/prisma/migrate-legacy-settings.ts`
  - `next-stack/apps/api/prisma/migrate-legacy-product-images.ts`
  - `next-stack/apps/api/prisma/migrate-legacy-visual-assets.ts`
- Motivo: aún contienen valor operativo de soporte y leen del legacy/root.
- Prerrequisitos:
  - cierre formal de migración de datos y assets
  - reemplazo o retiro documentado
- Validación:
  - QA backend
  - revisión de uso por operadores
- Aprobación humana: obligatoria.

11. `next-stack/scripts/qa-visual-parity.mjs`
- Motivo: todavía arranca Laravel root y usa `database/legacy-visual-parity.sqlite` como fallback.
- Prerrequisitos:
  - definir reemplazo del parity contra legacy
  - aprobar retiro de comparación activa con Laravel
- Validación: nueva estrategia de parity funcionando.
- Aprobación humana: obligatoria.

12. Assets duplicados en `public/` root
- Motivo: hoy son espejo histórico del set canónico, pero su retiro puede afectar scripts legacy/parity o revisiones manuales.
- Prerrequisitos:
  - retirar o adaptar `migrate-legacy-visual-assets.ts`
  - cerrar estrategia de parity visual
- Validación: branding, uploads, `qa:migration:close` y revisión manual.
- Aprobación humana: obligatoria.

13. Rutas alias legacy
- Motivo: están cubiertas por `qa:route-parity` y varias siguen existiendo para compatibilidad externa o interna.
- Prerrequisitos:
  - inventario de uso real
  - actualización de QA de parity
  - decisión humana sobre compatibilidad histórica
- Validación: `qa:route-parity`, `qa:frontend:e2e`, smoke manual.
- Aprobación humana: obligatoria.

14. Root legacy completo
- Ubicación: `app/`, `resources/`, `routes/`, `config/`, `database/`, `public/`, `storage/`, `bootstrap/`, `composer.json`
- Motivo: sigue siendo soporte histórico sensible y referencia funcional.
- Prerrequisitos:
  - deploy productivo del nuevo stack
  - retiro de parity y migradores legacy
  - política de archivo/cuarentena aprobada
- Validación: sign-off técnico y humano.
- Aprobación humana: obligatoria.

15. Dependencias legacy como `laravel/socialite` y `predis/predis`
- Ubicación: `composer.json`
- Motivo: parecen no tener uso confirmado en el nuevo stack, pero pertenecen al sistema histórico.
- Prerrequisitos: auditar referencias dentro del root Laravel.
- Validación: `composer test`, comandos ops relevantes, búsqueda de referencias.
- Aprobación humana: obligatoria.

## Orden recomendado de ejecución

### Fase 3A - quick wins controlados
1. Confirmar referencias de candidatos low-risk. [hecho]
2. Limpiar artefactos temporales claros. [hecho parcial: `.dev-logs/` pendiente por locks]
3. Registrar cambios en `CHANGELOG_AI.md`. [hecho]

### Fase 3B - consolidación de canonización
1. Formalizar `next-stack/.env` como única fuente viva. [hecho]
2. Revisar y resolver `manifest.webmanifest`. [hecho]
3. Decidir política de documentación histórica. [en curso]
4. Auditar archivos frontend no referenciados. [hecho]

### Fase 3C - desacople real del legacy
1. Definir reemplazo o retiro de `qa-visual-parity.mjs`.
2. Decidir destino de `migrate-legacy-*`.
3. Consolidar assets duplicados.
4. Revaluar aliases legacy por uso real.

### Fase 3D - tratamiento del root legacy
1. Elegir entre cuarentena, archivo parcial o retiro gradual.
2. Auditar dependencias Composer y docs legacy.
3. Ejecutar retiro solo con aprobación humana explícita.

## Qué puede hacerse sin aprobación explícita

Solo tareas low-risk después de verificar referencias y dejar trazabilidad:
- remover artefactos temporales inequívocos
- limpiar logs/reportes generados no versionados
- actualizar documentación y clasificación de riesgo

## Qué requiere aprobación humana explícita

- cualquier borrado dentro de `next-stack/apps/web/public`, salvo duplicados ya validados como no usados
- cualquier borrado en `public/` root
- retiro de scripts `migrate-legacy-*`
- retiro de `qa-visual-parity.mjs`
- retiro de aliases legacy
- cualquier acción sobre el root Laravel o sus dependencias Composer
