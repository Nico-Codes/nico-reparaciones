# OPEN_QUESTIONS

## Respondidas en fase 2 / fase 3

1. `legacy` debe seguir siendo arrancable en local para `qa:visual-parity`?
- Respondida: sí, hoy sigue teniendo valor operativo real.
- Evidencia: `next-stack/scripts/qa-visual-parity.mjs` puede arrancar `php artisan serve` en la raíz y usa fallback SQLite (`database/legacy-visual-parity.sqlite`).
- Estado: respondida.

2. Cual debe ser la fuente canonica definitiva de assets visuales?
- Respondida: `next-stack/apps/web/public`.
- Evidencia: API sirve y escribe sobre esa carpeta; los assets duplicados del root tienen hoy el mismo hash para branding relevante.
- Estado: respondida.

3. Los scripts `migrate-legacy-settings.ts`, `migrate-legacy-product-images.ts` y `migrate-legacy-visual-assets.ts` deben conservarse permanentemente?
- Respondida parcialmente: hoy deben conservarse como soporte histórico operativo; no hay evidencia suficiente para retirarlos sin una fase posterior.
- Estado: respondida parcialmente, retiro pendiente de decisión humana.

4. La existencia de `next-stack/apps/api/.env` sigue teniendo una razón operativa real?
- Respondida y ejecutada: no.
- Evidencia: backend y Vite quedaron alineados a `next-stack/.env`, y `next-stack/apps/api/.env` fue eliminado en Fase 3.
- Estado: cerrada.

7. Los componentes no referenciados del frontend son remanentes reales o reserva intencional?
- Respondida y ejecutada: eran remanentes sin referencias estáticas confirmadas.
- Evidencia: `rg` sin imports fuera de cada archivo; se eliminaron en Fase 3 y el typecheck quedó en verde.
- Estado: cerrada.

9. La carpeta `docs/` root debe seguir viva?
- Respondida parcialmente: ya no debe ser fuente viva principal; `project-docs/` pasa a gobernanza/contexto y `next-stack/docs/` a runbooks operativos.
- Estado: respondida parcialmente, consolidación futura pendiente.

10. Cual es la politica final para el root legacy una vez exista deploy productivo del nuevo stack?
- Respondida como recomendación: mantenerlo temporalmente como histórico activo y soporte transitorio, con objetivo de cuarentena/retiro gradual planificado.
- Estado: requiere decisión humana para ejecución.

## Siguen abiertas

5. Las rutas `/auth/google` y `/auth/google/callback` deben eliminarse, mantenerse como placeholders o implementarse de verdad?
- Evidencia actual: en `next-stack/apps/web/src/App.tsx` redirigen a `/auth/login`; no hay implementación nueva confirmada.
- Tipo: decisión de producto/alcance.

6. `laravel/socialite` sigue siendo necesario en el root legacy o quedó como arrastre del stack anterior?
- Evidencia actual: está en `composer.json`, pero no fue auditado todavía su uso completo dentro del root Laravel.
- Tipo: requiere auditoría específica del legacy.

8. Los SQLite de soporte en `database/` deben formar parte de una política estable del repo?
- Evidencia actual: `legacy-visual-parity.sqlite` sí tiene uso explícito; `database.sqlite` y `e2e.sqlite` parecen locales, pero falta política formal.
- Tipo: decisión operativa.

11. ¿Se debe purgar `next-stack/.dev-logs/` automáticamente cuando haya procesos locales activos o mantenerlo siempre como caché regenerable?
- Evidencia actual: en Fase 3 la carpeta no pudo eliminarse porque `api.log` y `web.log` estaban bloqueados por procesos activos.
- Tipo: decisión operativa / de tooling local.

## Requieren decisión humana explícita

- fecha y criterio de retiro de scripts legacy/parity
- fecha y criterio de cuarentena del root Laravel
- política final de compatibilidad para aliases legacy externos
- destino de dependencias legacy no confirmadas (`laravel/socialite`, `predis/predis`)
- política formal sobre SQLite locales y logs regenerables cuando hay procesos activos
