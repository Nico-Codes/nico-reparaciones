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

### [DL-0033]
- Fecha: 2026-03-11
- Estado: aceptada
- Tema: hardening adicional de modulos admin de negocio con foco en usuarios, venta rapida y catalogo operativo
- Contexto: tras el endurecimiento del core, todavia quedaban riesgos reales en modulos admin activos: cambio de rol sobre la propia cuenta desde UI, venta rapida demasiado permisiva frente a coincidencias parciales/lineas invalidas y acciones menores de productos/categorias que seguian expuestas a submits redundantes.
- Decision: reforzar estos modulos sin reabrir una fase grande, priorizando proteccion contra respuestas stale, mutaciones duplicadas, validacion previa a submit y feedback operativo claro por entidad o flujo.
- Impacto: baja el riesgo de errores silenciosos en mostrador/operacion, evita UX enganosa en acciones sensibles y deja la automatizacion frontend menos fragil para futuras iteraciones.
- Alternativas consideradas: dejar estos casos como backlog menor o confiar solo en validacion backend; descartado por seguir exponiendo errores evitables en la capa operativa diaria del admin.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/AdminUsersPage.tsx`, `next-stack/apps/web/src/features/orders/AdminQuickSalesPage.tsx`, `next-stack/apps/web/src/features/catalogAdmin/AdminProductsPage.tsx`, `next-stack/apps/web/src/features/catalogAdmin/AdminCategoriesPage.tsx`, `project-docs/FRONTEND_QA_HARDENING.md`, `CHANGELOG_AI.md`.
- Validacion requerida: typecheck/build de `@nico/api` y `@nico/web`, `smoke:backend`, `smoke:web`, `qa:route-parity` y `qa:frontend:e2e`.
- Responsable: Codex + operador humano

---

### [DL-0032]
- Fecha: 2026-03-11
- Estado: aceptada
- Tema: alta de reparaciones expuesta de forma nativa en el admin frontend
- Contexto: el backend ya soportaba `POST /repairs/admin` y el frontend tenía `repairsApi.adminCreate(...)`, pero no existían ni una ruta real, ni una pantalla de alta, ni un CTA visible para crear reparaciones desde el panel. El alias legacy `/admin/reparaciones/crear` además redirigía al listado, lo que dejaba el flujo incompleto.
- Decision: agregar la ruta real protegida `/admin/repairs/create`, crear una pantalla admin de alta alineada al design system vigente, exponer el CTA `Nueva reparacion` en `AdminRepairsListPage` y corregir el alias `/admin/reparaciones/crear` para que redirija a la nueva ruta.
- Impacto: el panel admin recupera un flujo operativo completo de ingreso de reparaciones sin depender de aliases ambiguos ni wiring pendiente, reutilizando la API real ya disponible y redirigiendo al detalle creado para continuar la gestion del caso.
- Alternativas consideradas: dejar solo el alias legacy o exponer un formulario inline dentro del listado; descartado por ocultar el flujo real y por mezclar alta con seguimiento operativo en la misma vista.
- Archivos / modulos afectados: `next-stack/apps/web/src/App.tsx`, `next-stack/apps/web/src/features/repairs/{api,AdminRepairsListPage,AdminRepairCreatePage,AdminRepairDetailPage}.tsx`, `next-stack/scripts/qa-frontend-e2e.mjs`, `CHANGELOG_AI.md`.
- Validacion requerida: typecheck/build de `@nico/api` y `@nico/web`, `smoke:web`, `smoke:backend`, `qa:route-parity` y una validacion puntual del flujo frontend crear -> detalle.
- Responsable: Codex + operador humano

---

### [DL-0031]
- Fecha: 2026-03-11
- Estado: aceptada
- Tema: quick wins funcionales sobre públicas de reparación y módulos admin secundarios
- Contexto: después del hardening del core seguían pendientes menores reales fuera del bloque principal: páginas públicas de reparación con mojibake y feedback ambiguo, usuarios admin sin protección contra respuestas stale/cambios duplicados, venta rápida con búsquedas viejas o CTAs demasiado permisivos y 2FA admin con copy roto y validación local floja.
- Decision: resolver el backlog menor sin abrir una fase grande, priorizando correcciones de UX/estado reales sobre rediseño: normalizar copy, mover páginas públicas a primitives vigentes, agregar protección por `requestId` donde hacía falta y endurecer estados `disabled`/errores en módulos secundarios activos.
- Decision complementaria: estabilizar la automatización de frontend en venta rápida usando selectores `data-qa` en vez de placeholders visibles, para que futuros ajustes de copy no rompan `qa:frontend:e2e`.
- Impacto: baja ruido residual visible, reduce dobles acciones y mejora la claridad de flujos secundarios sin tocar backend ni reabrir deuda estructural del frontend.
- Alternativas consideradas: dejar estos pendientes como deuda menor o abordarlos con otra fase visual más grande; descartado por el costo acumulado de bugs pequeños pero visibles en pantallas activas.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/repairs/{PublicRepairLookupPage,PublicRepairQuoteApprovalPage}.tsx`, `next-stack/apps/web/src/features/admin/AdminUsersPage.tsx`, `next-stack/apps/web/src/features/orders/AdminQuickSalesPage.tsx`, `next-stack/apps/web/src/features/admin/Admin2faSecurityPage.tsx`, `project-docs/FRONTEND_QA_HARDENING.md`.
- Validacion requerida: typecheck/build de `@nico/api` y `@nico/web`, `smoke:web` y una validación adicional razonable sobre auth/admin secundarios si los cambios lo justifican.
- Responsable: Codex + operador humano

---

### [DL-0030]
- Fecha: 2026-03-10
- Estado: aceptada
- Tema: guards reactivos y protección contra respuestas/mutaciones obsoletas en admin frontend
- Contexto: tras el primer hardening del frontend seguían existiendo casos borde reales: vistas protegidas que no reaccionaban a cambios de sesión ya iniciados, páginas de admin expuestas a resultados stale durante filtros rápidos y acciones por entidad que podían dispararse dos veces.
- Decisión: endurecer el frontend sin rediseñar la UI, haciendo reactivos `RequireAuth` y `RequireAdmin`, separando el estado de verificación de email según contexto real y agregando protecciones por `requestId` / `pending*` en módulos admin donde el usuario puede cambiar filtros o mutar entidades con rapidez.
- Impacto: reduce exposición a estados inconsistentes, evita acciones duplicadas y hace más robusta la navegación protegida sin tocar backend ni complejizar la arquitectura.
- Alternativas consideradas: confiar en refresh manual o en el eventual estado del backend para corregir la UI; descartado por dejar bugs silenciosos en flujos reales de uso.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/auth/{RequireAuth,RequireAdmin,VerifyEmailPage}.tsx`, `next-stack/apps/web/src/features/orders/AdminOrdersPage.tsx`, `next-stack/apps/web/src/features/catalogAdmin/{AdminProductsPage,AdminCategoriesPage}.tsx`, `project-docs/FRONTEND_QA_HARDENING.md`.
- Validacion requerida: typecheck/build de `@nico/api` y `@nico/web`, `smoke:backend`, `smoke:web`, `qa:route-parity` y `qa:frontend:e2e`.
- Responsable: Codex + operador humano

### [DL-0029]
- Fecha: 2026-03-10
- Estado: aceptada
- Tema: hardening funcional del frontend sobre flujos críticos
- Contexto: el frontend ya estaba visualmente consolidado, pero persistían bugs reales de UX/funcionamiento en store, auth, cuenta y admin: checkout usando líneas no normalizadas, dashboard con estados mal mapeados, CTAs que aparentaban deshabilitarse sin hacerlo de verdad, validaciones locales débiles y anclas de QA ausentes en páginas activas.
- Decisión: corregir los flujos críticos sin rediseñar la UI, reforzando validación local, manejo de errores, deshabilitación real de acciones, consistencia entre resumen y payload, y reutilizando helpers compartidos de estados como fuente de verdad.
- Impacto: reduce errores silenciosos en compra, elimina métricas engañosas en admin, mejora claridad de auth/cuenta y fortalece la automatización QA del frontend.
- Alternativas consideradas: limitarse a cambios de copy o dejar el hardening para una fase posterior; descartado por mantener bugs reales en flujos del core del producto.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/cart/CartPage.tsx`, `next-stack/apps/web/src/features/orders/CheckoutPage.tsx`, `next-stack/apps/web/src/features/orders/MyOrdersPage.tsx`, `next-stack/apps/web/src/features/repairs/MyRepairsPage.tsx`, `next-stack/apps/web/src/features/auth/{AuthLayout,LoginPage,RegisterPage,ForgotPasswordPage,VerifyEmailPage,MyAccountPage}.tsx`, `next-stack/apps/web/src/features/admin/{AdminDashboardPage,AdminSettingsHubPage}.tsx`, `project-docs/FRONTEND_QA_HARDENING.md`.
- Validacion requerida: typecheck/build de `@nico/api` y `@nico/web`, `smoke:backend`, `smoke:web`, `qa:route-parity` y `qa:frontend:e2e`.
- Responsable: Codex + operador humano

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

### [DL-0028]
- Fecha: 2026-03-10
- Estado: aceptada
- Tema: code splitting por ruta para reducir el chunk inicial del frontend
- Contexto: el build de `@nico/web` seguía mostrando el warning de chunk grande de Vite. La causa principal era que `next-stack/apps/web/src/App.tsx` importaba de forma eager la mayoría de las páginas del producto, incluyendo vistas admin y módulos secundarios que no deberían entrar en la carga inicial.
- Decisión: convertir las páginas del router a carga diferida con `React.lazy` y `Suspense`, manteniendo eager solo el shell, guards y utilidades pequeñas realmente transversales.
- Impacto: el chunk principal del frontend bajó de aproximadamente `769.29 kB` a `317.30 kB`, desapareció el warning de chunk grande en el build actual y el producto quedó dividido por ruta de forma más sana para seguir creciendo.
- Alternativas consideradas: agregar `manualChunks` en Vite sin tocar el router o silenciar el warning; descartado por atacar el síntoma en vez de la causa principal.
- Archivos / modulos afectados: `next-stack/apps/web/src/App.tsx`, `project-docs/FRONTEND_PERFORMANCE.md`, `CHANGELOG_AI.md`.
- Validacion requerida: typecheck, build, `smoke:web` y `qa:route-parity`.
- Responsable: Codex + operador humano

### [DL-0029]
- Fecha: 2026-03-11
- Estado: aceptada
- Tema: endurecer el flujo admin de alta y edicion de reparaciones
- Contexto: el frontend admin ya tenia alta real de reparaciones, pero el create/detail seguian con validacion local floja, manejo de errores mezclado, posibilidad de submits redundantes y riesgo de respuestas stale al refrescar detalle o catalogo.
- Decisión: fortalecer `AdminRepairCreatePage` y `AdminRepairDetailPage` con validaciones locales alineadas al backend real, separacion de errores de carga/guardado, proteccion contra doble submit, refresco consistente del detalle despues de guardar y fallback claro entre catalogo tecnico y carga manual.
- Impacto: el modulo admin de reparaciones queda mas confiable para uso de mostrador/taller, evita UX engañosa y reduce riesgo de guardar datos parciales o dejar historial desactualizado en pantalla.
- Alternativas consideradas: dejar el flujo actual y tratar los casos borde solo desde QA; descartado por seguir exponiendo errores silenciosos y estados inconsistentes en un modulo operativo.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/repairs/AdminRepairCreatePage.tsx`, `next-stack/apps/web/src/features/repairs/AdminRepairDetailPage.tsx`, `next-stack/apps/web/src/features/repairs/AdminRepairsListPage.tsx`, `next-stack/apps/web/src/features/repairs/api.ts`, `project-docs/FRONTEND_QA_HARDENING.md`, `CHANGELOG_AI.md`.
- Validacion requerida: typecheck, build, `smoke:backend`, `smoke:web`, `qa:route-parity`, `qa:frontend:e2e` y una prueba dirigida `listado -> crear -> detalle -> editar/guardar`.
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


