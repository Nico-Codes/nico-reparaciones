# Reglas permanentes para agentes e IA en NicoReparaciones

## Alcance general
- Este repositorio contiene tres categorías que deben distinguirse siempre:
  - `canónico operativo`: `next-stack/`
  - `histórico / soporte transitorio`: raíz Laravel/Blade/PHP
  - `candidato a retiro`: solo lo clasificado explícitamente en `project-docs/CLEANUP_CANDIDATES.md` o `project-docs/CLEANUP_EXECUTION_PLAN.md`
- Antes de tocar código o assets, identificar en qué categoría cae cada archivo.

## Fuentes canónicas obligatorias
- Código operativo canónico:
  - `next-stack/apps/web`
  - `next-stack/apps/api`
  - `next-stack/packages/contracts`
- Assets visuales canónicos: `next-stack/apps/web/public`
- Entorno/configuración canónica: `next-stack/.env` y sus `.env*.example`
- Documentación viva canónica: `project-docs/`
- Runbooks operativos del nuevo stack: `next-stack/docs/`
- `next-stack/apps/api/.env` no debe recrearse; si aparece, tratarlo como drift respecto de la fuente canónica.

## Fuentes no canónicas / históricas
- La raíz Laravel no debe tratarse como fuente primaria para features nuevas.
- `public/` root es histórico/transitorio; no usarlo como fuente primaria de assets del nuevo stack.
- `docs/` root es histórico/general; no usarlo como única fuente viva de gobernanza.

## Reglas críticas
- No hacer cambios destructivos sin validación humana explícita.
- No borrar archivos, carpetas, assets, scripts, dependencias o documentación sensible sin auditar referencias primero.
- No asumir que algo está muerto solo porque no parece usarse; confirmar con búsqueda real en el repo y documentar el hallazgo.
- No refactorizar masivamente sin dejar antes contexto y criterio en `project-docs/`.
- No modificar comportamiento funcional del sistema en fases de auditoría/documentación.

## Limpieza y deuda técnica
- Toda propuesta de cleanup debe comenzar con auditoría y clasificación de riesgo.
- Queda prohibido hacer cleanup destructivo sin clasificar primero el cambio como `bajo`, `medio` o `alto` riesgo.
- Antes de eliminar algo, registrar:
  - ubicación
  - evidencia de por qué parece obsoleto
  - riesgo
  - validaciones humanas necesarias
- Si el cleanup toca artefactos generados pero hay locks del sistema operativo por procesos de desarrollo, no forzar borrados a ciegas: detener procesos o dejar el ítem pendiente documentado.
- No eliminar configuraciones, assets o scripts vinculados a migración, QA, parity visual o soporte legacy sin verificar dependencias cruzadas.
- Si un cambio toca fuentes canónicas, aliases legacy, env, branding o soporte root legacy, registrar decisión en `project-docs/DECISIONS_LOG.md` antes o junto con la intervención.

## Dependencias y librerías
- No introducir librerías nuevas sin justificar necesidad técnica, impacto y alternativas.
- Si una dependencia parece sospechosa o duplicada, documentarla primero en `project-docs/CLEANUP_CANDIDATES.md` o `project-docs/OPEN_QUESTIONS.md`.

## Cambios en código
- No dejar código comentado como “basura legacy”.
- Si se toca un archivo, reportar exactamente:
  - qué se tocó
  - por qué
  - si cambia comportamiento o no
- Antes de tocar módulos sensibles, revisar contexto en:
  - `project-docs/CANONICAL_SOURCES.md`
  - `project-docs/ARCHITECTURE.md`
  - `project-docs/FRONTEND_MAP.md`
  - `project-docs/BACKEND_MAP.md`
  - `project-docs/BUSINESS_RULES.md`

## Módulos sensibles
Tratar con especial cuidado:
- autenticación y refresh tokens
- settings dinámicos vía `AppSetting`
- branding/assets públicos
- pricing de reparaciones y productos
- dashboard/admin service y catálogos
- rutas alias legacy
- scripts QA, visual parity y detach del legacy
- políticas de `.env` y configuración operativa

## Ambigüedad y validación
- Cuando haya ambigüedad real, preguntar antes de asumir si el riesgo de error es alto.
- Si una intervención afecta cleanup, deploy, auth, pricing o assets compartidos, pedir validación antes de ejecutar cambios irreversibles.
- Distinguir siempre entre:
  - `histórico`
  - `canónico`
  - `candidato a retiro`

## Registro y trazabilidad
- Registrar decisiones técnicas en `project-docs/DECISIONS_LOG.md`.
- Registrar cambios asistidos por IA en `CHANGELOG_AI.md`.
- Si una intervención relevante altera el entendimiento del repo, actualizar la documentación viva correspondiente.
