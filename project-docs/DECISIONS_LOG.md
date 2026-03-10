# DECISIONS_LOG

## Proposito

Registrar decisiones tecnicas confirmadas para evitar dependencia de memoria oral.

## Formato recomendado

### [ID]
- Fecha:
- Estado: propuesta | aceptada | descartada | reemplazada
- Tema:
- Contexto:
- Decision:
- Impacto:
- Alternativas consideradas:
- Archivos / modulos afectados:
- Validacion requerida:
- Responsable:

---

## Entradas

### [DL-0027]
- Fecha: 2026-03-09
- Estado: aceptada
- Tema: cierre corto de polish visual sobre detalles activos y residuos legacy finales
- Contexto: después del pulido global seguían activos algunos módulos con wrappers de tienda, `btn-*`, badges legacy y mojibake visible, especialmente en `AdminCategoriesPage`, los detalles admin de pedidos/reparaciones y los detalles de cuenta.
- Decision: alinear esas vistas al sistema visual canónico, reutilizando `PageShell`, `PageHeader`, `SectionCard`, `StatusBadge`, `Button`, `TextField`, `TextAreaField`, `ProgressSteps` y helpers de estados compartidos, además de limpiar el copy restante visible.
- Impacto: reduce los últimos residuos visuales evidentes del sistema viejo en vistas activas, cierra mejor la etapa de UX/UI y deja el frontend listo para seguir evolucionando sin deuda visual relevante en las pantallas principales.
- Alternativas consideradas: dejar estos quick wins para una fase posterior o limitarse a corrección textual; descartado por mantener incoherencias visibles justo en vistas de detalle usadas en operación diaria.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/catalogAdmin/AdminCategoriesPage.tsx`, `next-stack/apps/web/src/features/orders/AdminOrderDetailPage.tsx`, `next-stack/apps/web/src/features/repairs/AdminRepairDetailPage.tsx`, `next-stack/apps/web/src/features/orders/OrderDetailPage.tsx`, `next-stack/apps/web/src/features/repairs/RepairDetailPage.tsx`, `next-stack/apps/web/src/features/orders/order-ui.ts`, `next-stack/apps/web/src/features/repairs/repair-ui.ts`, `project-docs/UI_STYLE_GUIDE.md`, `project-docs/DESIGN_SYSTEM.md`, `project-docs/UI_APPLICATION_PLAN.md`.
- Validacion requerida: `env:check`, typecheck, build, smoke, `qa:route-parity`, `qa:responsive:visual` y un chequeo visual admin adicional.
- Responsable: Codex + operador humano

### [DL-0026]
- Fecha: 2026-03-09
- Estado: aceptada
- Tema: cierre visual de módulos secundarios admin y retiro de residuos visuales legacy en vistas activas
- Contexto: después de consolidar admin core, flujo comercial y cuenta usuario, seguían quedando módulos secundarios admin con wrappers de tienda, `btn-*`, badges viejos, formularios poco agrupados y copy/encoding inconsistente.
- Decision: alinear `AdminProductsPage`, `AdminProductCreatePage`, `AdminProductEditPage`, `AdminProductLabelPage`, `AdminBusinessSettingsPage` y `AdminAlertsPage` al sistema visual canónico, reforzando `PageShell`, `PageHeader`, `SectionCard`, `StatusBadge`, `Button`, `TextField`, `TextAreaField`, `FilterBar` y `choice-card`.
- Impacto: reduce deuda visual real en vistas activas importantes, mejora claridad operativa del admin y deja muy pocos residuos visibles del sistema viejo de estilos en la capa principal del frontend.
- Alternativas consideradas: postergar estos módulos para un pase futuro y limitarse a admin core; descartado por dejar inconsistencias visibles justo en zonas de trabajo diario del panel.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/catalogAdmin/*`, `next-stack/apps/web/src/features/admin/AdminBusinessSettingsPage.tsx`, `next-stack/apps/web/src/features/admin/AdminAlertsPage.tsx`, `next-stack/apps/web/src/components/ui/textarea-field.tsx`, `next-stack/apps/web/src/styles.css`, `project-docs/UI_STYLE_GUIDE.md`, `project-docs/DESIGN_SYSTEM.md`, `project-docs/UI_APPLICATION_PLAN.md`.
- Validacion requerida: `env:check`, typecheck, build, smoke, `qa:route-parity`, `qa:responsive:visual` y validación visual admin incremental.
- Responsable: Codex + operador humano

### [DL-0025]
- Fecha: 2026-03-09
- Estado: aceptada
- Tema: cuenta usuario alineada al design system canónico
- Contexto: tras consolidar admin core y flujo comercial, la cuenta usuario seguía mezclando wrappers heredados, estados pobres y detalle insuficiente en pedidos y reparaciones.
- Decision: aplicar la base reusable sobre `MyOrdersPage`, `MyRepairsPage`, `OrderDetailPage` y `RepairDetailPage`, incorporando además patrones nuevos de seguimiento (`ProgressSteps`), listados de cuenta (`account-record`) y resúmenes estructurados (`fact-list`).
- Impacto: la cuenta pasa a sentirse como una extensión natural del producto, con mejor jerarquía visual, seguimiento entendible y consistencia real con tienda y admin.
- Alternativas consideradas: seguir corrigiendo estas vistas con cards y textos inline; descartado por perpetuar deuda visual y estados inconsistentes.
- Archivos / modulos afectados: `next-stack/apps/web/src/components/ui/progress-steps.tsx`, `next-stack/apps/web/src/features/orders/*`, `next-stack/apps/web/src/features/repairs/*`, `next-stack/apps/web/src/styles.css`, `project-docs/UI_STYLE_GUIDE.md`, `project-docs/DESIGN_SYSTEM.md`, `project-docs/UI_APPLICATION_PLAN.md`.
- Validacion requerida: `env:check`, typecheck, build, smoke, `qa:route-parity` y una validación visual frontend adicional.
- Responsable: Codex + operador humano

### [DL-0024]
- Fecha: 2026-03-09
- Estado: aceptada
- Tema: adopcion real del sistema visual en admin core y flujo comercial
- Contexto: la fundacion reusable ya existia, pero las vistas mas importantes del producto seguian usando wrappers viejos, badges inconsistentes, acciones muertas y layouts con jerarquia floja.
- Decision: aplicar la base canónica a `AdminOrdersPage`, `AdminRepairsListPage`, `StoreProductDetailPage`, `CartPage` y `CheckoutPage`, reforzando `PageShell`, `PageHeader`, `SectionCard`, `StatusBadge`, `FilterBar`, `EmptyState`, `LoadingBlock`, `Button` y nuevos patrones de apoyo (`ui-alert`, `nr-stat-grid`, `admin-entity-row`, `line-item`, `quantity-stepper`, `checkout-option`).
- Impacto: el admin core ya se percibe como panel SaaS claro y el flujo producto -> carrito -> checkout gana orden, confianza visual y consistencia real con la marca del sistema.
- Alternativas consideradas: seguir corrigiendo pantalla por pantalla con clases inline y wrappers heredados; descartado por mantener deuda visual y baja mantenibilidad.
- Archivos / modulos afectados: `next-stack/apps/web/src/styles.css`, `AdminOrdersPage`, `AdminRepairsListPage`, `StoreProductDetailPage`, `CartPage`, `CheckoutPage`, `project-docs/UI_STYLE_GUIDE.md`, `project-docs/DESIGN_SYSTEM.md`, `project-docs/UI_APPLICATION_PLAN.md`.
- Validacion requerida: `env:check`, typecheck, build, smoke, `qa:route-parity` y validacion visual incremental del flujo admin/comercial.
- Responsable: Codex + operador humano

### [DL-0023]
- Fecha: 2026-03-09
- Estado: aceptada
- Tema: fundación visual reusable y separación de contexto en frontend
- Contexto: el frontend ya tenía una dirección visual canónica definida, pero seguía mezclando wrappers de tienda con vistas admin y cuenta, usando badges inconsistentes y muy baja adopción del componente `Button`.
- Decisión: consolidar una base reusable en `next-stack/apps/web` con `PageShell`, `PageHeader`, `SectionCard`, `StatusBadge`, `EmptyState`, `LoadingBlock`, `TextField` y `FilterBar`; además, hacer que `AppShell` distinga contexto visual `admin | store | account` y aplicar la base en un conjunto pequeño de vistas representativas.
- Impacto: reduce deuda visual, habilita adopción incremental del sistema y evita seguir resolviendo UI pantalla por pantalla con patrones distintos.
- Alternativas consideradas: seguir mejorando vistas aisladas con clases locales; descartado por mantener inconsistencia y ruido visual.
- Archivos / modulos afectados: `next-stack/apps/web/src/styles.css`, `next-stack/apps/web/src/components/ui/*`, `next-stack/apps/web/src/layouts/AppShell.tsx`, `AdminDashboardPage`, `AdminSettingsHubPage`, `StorePage`, `MyAccountPage`, `MyOrdersPage`.
- Validacion requerida: `env:check`, typecheck, build, smoke y revisión visual incremental en las vistas adoptadas.
- Responsable: Codex + operador humano

### [DL-0022]
- Fecha: 2026-03-09
- Estado: aceptada
- Tema: direccion visual canonica del producto
- Contexto: el frontend operativo ya estaba funcional, pero con mezcla de patrones entre admin, tienda y cuenta, baja adopcion de componentes base y ausencia de un design system real.
- Decision: fijar una direccion visual unica basada en `Clean SaaS / Admin claro` para admin, `Clean eCommerce minimal` para tienda y una capa intermedia para cuenta usuario, documentada en `project-docs/UI_STYLE_GUIDE.md`, `project-docs/DESIGN_SYSTEM.md` y `project-docs/UI_APPLICATION_PLAN.md`.
- Impacto: establece una fuente de verdad para futuras mejoras frontend, evita rehacer pantallas sin criterio compartido y reduce el riesgo de volver al caos visual.
- Alternativas consideradas: seguir mejorando pantalla por pantalla sin guia canonica; descartado por alta probabilidad de inconsistencia y deuda visual.
- Archivos / modulos afectados: `project-docs/UI_STYLE_GUIDE.md`, `project-docs/DESIGN_SYSTEM.md`, `project-docs/UI_APPLICATION_PLAN.md`
- Validacion requerida: revision visual/tactica del operador humano y posterior implementacion incremental con build/typecheck/smoke.
- Responsable: Codex + operador humano

### [DL-0018]
- Fecha: 2026-03-09
- Estado: aceptada
- Tema: parity visual legacy fuera del gate principal
- Contexto: `qa:visual-parity` seguia dependiendo del root Laravel y de un SQLite auxiliar, pero el proyecto ya cuenta con un gate moderno suficiente (`env:check`, typecheck, build, smoke, route parity y checks visuales del nuevo stack).
- Decision: reclasificar `qa:visual-parity` como herramienta deprecated/manual y retirarla del flujo normal y del gate principal.
- Impacto: reduce complejidad, desacopla el mantenimiento diario del root Laravel y aclara que la salud del proyecto se mide desde el stack nuevo.
- Alternativas consideradas: mantenerla como gate o como chequeo rutinario; descartado por costo alto y cobertura redundante.
- Archivos / modulos afectados: `next-stack/package.json`, `next-stack/legacy-support/deprecated/qa/qa-visual-parity.mjs`, `next-stack/docs/*`, `project-docs/PARITY_STRATEGY.md`
- Validacion requerida: gate operativo del nuevo stack.
- Responsable: Codex + operador humano

### [DL-0019]
- Fecha: 2026-03-09
- Estado: aceptada
- Tema: migradores legacy archivados
- Contexto: los dry-run recientes mostraron que settings, product-images y visual-assets legacy ya no aportan cambios reales al stack nuevo.
- Decision: mover `migrate-legacy-settings.ts`, `migrate-legacy-product-images.ts` y `migrate-legacy-visual-assets.ts` a `next-stack/legacy-support/deprecated/api/` y sacarlos del flujo normal.
- Impacto: el stack operativo queda mas claro y el soporte legacy deja de parecer tooling diario.
- Alternativas consideradas: eliminarlos ya; descartado por mantener un ultimo margen de rescate/manualidad mientras se cierra el retiro del root.
- Archivos / modulos afectados: `next-stack/apps/api/package.json`, `next-stack/package.json`, `next-stack/legacy-support/deprecated/api/*`, `project-docs/LEGACY_SUPPORT_MAP.md`
- Validacion requerida: typecheck/build/smokes/route parity.
- Responsable: Codex + operador humano

### [DL-0020]
- Fecha: 2026-03-09
- Estado: aceptada
- Tema: retiro material del root Laravel y del soporte legacy
- Contexto: tras retirar auth social, parity legacy y migradores del flujo normal, el repo ya no tenia dependencia tecnica real del runtime Laravel ni de `next-stack/legacy-support/`.
- Decision: eliminar el runtime Laravel root, eliminar `next-stack/legacy-support/`, reescribir `nico-dev.bat`, `README.md` y CI hacia `next-stack/` y tratar la raiz restante solo como meta-repo + documentacion.
- Impacto: el repositorio queda alineado con una sola arquitectura operativa y deja de mezclar stacks, mirrors y tooling historico.
- Alternativas consideradas: conservar el root como historico activo; descartado por complejidad innecesaria y por ir contra la estrategia de eliminacion total del legacy.
- Archivos / modulos afectados: runtime Laravel root, `next-stack/legacy-support/`, `.github/workflows/ci.yml`, `nico-dev.bat`, `README.md`, `project-docs/*`.
- Validacion requerida: gate operativo del nuevo stack.
- Responsable: Codex + operador humano

### [DL-0021]
- Fecha: 2026-03-09
- Estado: aceptada
- Tema: cierre oficial de migracion y consolidacion documental final
- Contexto: el stack nuevo ya habia reemplazado completamente al legacy y el repo quedo sin runtime Laravel ni tooling heredado activo.
- Decision: declarar oficialmente cerrada la migracion, consolidar `project-docs/` como unica documentacion viva, mantener `next-stack/docs/` como runbooks del stack actual y retirar historicos narrativos redundantes del repo.
- Impacto: elimina ambiguedad sobre el estado del proyecto y deja un repositorio coherente para desarrollo normal sobre el nuevo stack.
- Alternativas consideradas: conservar documentos historicos narrativos dentro del repo; descartado por duplicacion y ruido documental.
- Archivos / modulos afectados: `project-docs/MIGRATION_CLOSURE.md`, `project-docs/MIGRATION_STATUS.md`, `README.md`, `AGENTS.md`, `CHANGELOG_AI.md`, historicos documentales retirados.
- Validacion requerida: gate canonico del nuevo stack.
- Responsable: Codex + operador humano
