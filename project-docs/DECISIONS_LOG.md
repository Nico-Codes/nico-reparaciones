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

### [DL-0040]
- Fecha: 2026-03-12
- Estado: aceptada
- Tema: ajustar extraccion y ranking de busqueda multi-proveedor usando proveedores reales
- Contexto: la busqueda agregada ya estaba integrada en reparaciones, pero los resultados reales seguian teniendo ruido operativo: labels contaminados por CTAs de WooCommerce, precios mal parseados en algunos sitios y ranking que todavia dejaba colarse opciones poco utiles frente a proveedores reales del taller.
- Decision: endurecer `AdminService` con perfiles HTML concretos para `Evophone`, `Okey Rosario`, `Celuphone`, `Novocell` y `Electrostore`, mejorar el parser monetario para formatos reales de WooCommerce/Wix, limpiar labels tipo `Añadir al carrito` y rankear mejor por coincidencia exacta, precio real y disponibilidad.
- Impacto: la busqueda agregada devuelve resultados mucho mas utiles para consultas reales de repuestos, reduce falsos positivos y deja el flujo proveedor + repuesto + snapshot mas confiable sin reabrir la arquitectura ni romper create/detail.
- Alternativas consideradas: dejar el ranking tal como estaba o seguir corrigiendo solo con `z-index`/UI en frontend; descartado por atacar sintomas y no la calidad real de la extraccion.
- Archivos / modulos afectados: `next-stack/apps/api/src/modules/admin/admin.service.ts`, `project-docs/REPAIR_PROVIDER_PART_PRICING_PLAN.md`, `CHANGELOG_AI.md`.
- Validacion requerida: typecheck/build de `@nico/api` y `@nico/web`, `smoke:backend`, `smoke:web`, `qa:route-parity`, `qa:frontend:e2e` y probe dirigido con query real `modulo samsung a10`.
- Responsable: Codex + operador humano
---

### [DL-0041]
- Fecha: 2026-03-12
- Estado: aceptada
- Tema: dejar visibles la marca y el modelo exactos del catálogo en `Nueva reparación`
- Contexto: la vista de alta ya había quedado simplificada en tres bloques, pero `Marca exacta del catálogo` y `Modelo exacto del catálogo` seguían ocultos en un disclosure secundario. En el flujo actual esos campos sí impactan el cálculo y la búsqueda de repuestos porque alimentan `pricingResolve` y el preview proveedor + repuesto + regla.
- Decision: mover ambos campos al bloque visible `Datos básicos` y dejar colapsadas solo las `Notas internas`. También se corrige el copy visible del alta y de la sección `Proveedor y repuesto` para cerrar acentos y labels operativos.
- Impacto: el operador ve desde el inicio los campos que realmente mejoran el cálculo y la búsqueda de repuestos, sin volver a expandir un bloque secundario dentro del flujo principal del alta.
- Alternativas consideradas: mantener marca/modelo exactos ocultos para conservar la pantalla aun más mínima; descartado porque hoy esos campos sí aportan valor práctico y quedaban demasiado escondidos para el flujo real.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/repairs/AdminRepairCreatePage.tsx`, `next-stack/apps/web/src/features/repairs/RepairProviderPartPricingSection.tsx`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck`, `build`, `smoke:web` y verificación real de `Nueva reparación -> create`.
- Responsable: Codex + operador humano

### [DL-0042]
- Fecha: 2026-03-12
- Estado: aceptada
- Tema: convertir el dashboard admin en panel de trabajo diario y no en mapa general del sistema
- Contexto: el dashboard administrativo mostraba métricas, alertas, accesos frecuentes y actividad reciente con peso visual parecido. Eso lo hacía útil como resumen general, pero pobre como panel operativo para mostrador/taller, donde lo más valioso es abrir reparaciones, ventas, stock y atender cola de trabajo.
- Decision: reorganizar `AdminDashboardPage` en cinco capas: `Acciones rápidas` arriba y grandes, `Resumen operativo` con indicadores clickeables, `Bandeja de trabajo` para urgencias, `Gestión principal` para módulos usados a diario y `Administración avanzada` compacta/colapsable para lo secundario. Las métricas quedan visibles pero con menor jerarquía.
- Impacto: lo más usado (`Nueva reparación`, `Nueva venta`, `Ingresar stock`, reparaciones activas, pedidos activos y stock bajo) queda arriba y con mayor peso. Configuración, seguridad, FAQ, reportes, contabilidad y módulos menos frecuentes bajan a una sección avanzada y compacta.
- Alternativas consideradas: mantener el dashboard actual con solo cambios cosméticos o esconder más módulos en el menú lateral; descartado porque no resolvía la jerarquía operativa del panel principal.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/AdminDashboardPage.tsx`, `next-stack/apps/web/src/styles.css`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck`, `build`, `smoke:web` y verificación real del dashboard admin con foco en jerarquía, visibilidad de quick actions y navegación.
- Responsable: Codex + operador humano
---

### [DL-0039]
- Fecha: 2026-03-12
- Estado: aceptada
- Tema: exponer historial basico de snapshots y clarificar la semantica operativa del pricing aplicado en reparaciones
- Contexto: la Fase 2 ya habia dejado create/detail conectados a proveedor + repuesto + preview + snapshot activo, pero el operador todavia no podia leer con suficiente claridad la diferencia entre snapshot activo, preview nuevo, precio sugerido, precio aplicado y presupuesto actual del caso.
- Decision: mantener la persistencia actual y sumar una Fase 3 corta de UX/historial. `adminDetail` ahora expone `pricingSnapshots` historicos y el detalle admin muestra snapshot activo, historial basico y mensajes operativos claros para distinguir calculo aplicado, override manual y modificaciones posteriores del presupuesto.
- Impacto: mejora trazabilidad real sin abrir comparacion multiple ni una nueva fase grande de dominio, y deja mucho mas claro para el operador de donde sale cada monto en el caso.
- Alternativas consideradas: dejar el snapshot activo como unica referencia visible o esperar a una futura comparacion avanzada; descartado por mantener ambiguedad operativa innecesaria en un modulo ya en uso real.
- Archivos / modulos afectados: `next-stack/apps/api/src/modules/repairs/repairs.service.ts`, `next-stack/apps/web/src/features/repairs/{api.ts,RepairProviderPartPricingSection.tsx,AdminRepairDetailPage.tsx}`, `project-docs/REPAIR_PROVIDER_PART_PRICING_PLAN.md`, `project-docs/FRONTEND_QA_HARDENING.md`.
- Validacion requerida: typecheck/build de `@nico/api` y `@nico/web`, `smoke:backend`, `smoke:web`, `qa:route-parity`, `qa:frontend:e2e` y probe dirigido con create/update/manual override para verificar historial y timeline.
- Responsable: Codex + operador humano
---

### [DL-0038]
- Fecha: 2026-03-11
- Estado: aceptada
- Tema: integrar proveedor + repuesto + snapshot de pricing dentro del flujo admin de reparaciones
- Contexto: la Fase 1 ya habia dejado lista la base tecnica con `RepairPricingSnapshot`, busqueda normalizada de repuestos por proveedor y preview backend proveedor + repuesto + regla. Faltaba conectar esa base a create/detail sin abrir todavia una UX gigante ni un catalogo local permanente de repuestos.
- Decision: integrar la seleccion de proveedor, busqueda de repuesto, preview real y aplicacion explicita de snapshot dentro de `AdminRepairCreatePage` y `AdminRepairDetailPage`, persistiendo el snapshot solo cuando el operador lo aplica como parte del create/update del caso. El `quotedPrice` sigue siendo editable y nunca se sobrescribe automaticamente.
- Impacto: la feature deja de ser solo infraestructura backend y pasa a ser operativa en el admin, con snapshot historico util, sin romper el flujo minimo existente de `pricingResolve` y sin extender aun el dominio Repair a proveedor/repuesto permanentes fuera del snapshot.
- Alternativas consideradas: dejar la Fase 1 sin UI hasta una fase posterior o persistir previews automaticamente; descartado por desaprovechar la inversion hecha y por generar snapshots basura o UX enganosa.
- Archivos / modulos afectados: `next-stack/apps/api/src/modules/repairs/{repairs.controller.ts,repairs.service.ts}`, `next-stack/apps/web/src/features/repairs/{api.ts,types.ts,repair-pricing.ts,RepairProviderPartPricingSection.tsx,AdminRepairCreatePage.tsx,AdminRepairDetailPage.tsx}`, `project-docs/REPAIR_PROVIDER_PART_PRICING_PLAN.md`, `project-docs/FRONTEND_QA_HARDENING.md`.
- Validacion requerida: typecheck/build de `@nico/api` y `@nico/web`, `smoke:backend`, `smoke:web`, `qa:route-parity`, `qa:frontend:e2e` y probe dirigido `provider -> part -> preview -> create/update con snapshot`.
- Responsable: Codex + operador humano
---

### [DL-0037]
- Fecha: 2026-03-11
- Estado: aceptada
- Tema: implementar la Fase 1 de reparaciones con proveedor + repuesto + calculo real sin abrir todavia la UX completa
- Contexto: la auditoria previa ya habia definido el modelo de snapshots, la necesidad de una busqueda normalizada de repuestos por proveedor y la conveniencia de no sobrecargar `pricingResolve`. Faltaba aterrizar una base tecnica real para que la siguiente fase de UI no dependa de supuestos.
- Decision: implementar en backend y schema solo tres piezas: `RepairPricingSnapshot` + `Repair.activePricingSnapshotId`, un endpoint de busqueda normalizada de repuestos por proveedor (`POST /api/admin/providers/:id/search-parts`) y un endpoint separado de preview de pricing proveedor + repuesto + regla (`POST /api/pricing/repairs/provider-part-preview`). La UI final de create/detail queda explicitamente fuera de esta fase.
- Impacto: deja lista una base persistible y ejecutable para la feature completa sin romper `pricingResolve`, sin inventar un catalogo local de repuestos y sin abrir todavia una fase gigante de frontend.
- Alternativas consideradas: implementar toda la UX de una vez, agregar solo tablas sin endpoints o sobrecargar `pricingResolve`; descartado por riesgo alto, wiring incompleto o mezcla indebida de responsabilidades.
- Archivos / modulos afectados: `next-stack/apps/api/prisma/schema.prisma`, migracion `20260311170000_add_repair_pricing_snapshots_phase1`, `next-stack/apps/api/src/modules/admin/admin.{controller,service}.ts`, `next-stack/apps/api/src/modules/pricing/{pricing.controller.ts,pricing.service.ts}`, `next-stack/apps/web/src/features/admin/api.ts`, `next-stack/apps/web/src/features/repairs/api.ts`, `project-docs/REPAIR_PROVIDER_PART_PRICING_PLAN.md`, `project-docs/BACKEND_BUSINESS_RULES_HARDENING.md`.
- Validacion requerida: generate + migrate Prisma, typecheck/build de `@nico/api` y `@nico/web`, smoke backend/web, route parity, frontend e2e y probes dirigidos de busqueda por proveedor + preview de calculo.
- Responsable: Codex + operador humano
---

### [DL-0036]
- Fecha: 2026-03-11
- Estado: aceptada
- Tema: migrar la feature completa de reparaciones con proveedor + repuesto + calculo real por fases y con snapshots historicos
- Contexto: el stack nuevo ya tiene modulo de proveedores, reglas de pricing y `pricingResolve` conectado a reparaciones admin, pero todavia no une proveedor, repuesto y costo real dentro del dominio `Repair`. El runtime legacy ya no existe en el repo, asi que la feature vieja solo puede reconstruirse parcialmente desde evidencia sobreviviente.
- Decision: no extender `Repair` con campos sueltos de proveedor/repuesto ni sobrecargar `pricingResolve`. La migracion correcta debe partir de un modelo `RepairPricingSnapshot` con snapshots historicos del proveedor, repuesto, costo base, regla aplicada y presupuesto sugerido/aplicado, mas una referencia opcional al snapshot activo en `Repair`. La implementacion recomendada es por fases: modelo + busqueda real de repuestos, luego preview de calculo, luego integracion create/detail.
- Impacto: evita una implementacion incompleta o enganosa, protege la trazabilidad historica del presupuesto y deja una base clara para recuperar la feature legacy completa sin depender de datos vivos del proveedor ni de reglas mutables.
- Alternativas consideradas: agregar solo `supplierId` a `Repair`, persistir solo el monto final o reutilizar `pricingResolve` tal como esta; descartado por no preservar contexto del calculo, por mezclar concerns y por dejar al caso expuesto a drift historico.
- Archivos / modulos afectados: `project-docs/REPAIR_PROVIDER_PART_PRICING_PLAN.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: auditoria de schema, repairs, pricing, providers y warranties; contraste con documentacion viva y validacion humana posterior del comportamiento legacy exacto si aparece evidencia externa al repo.
- Responsable: Codex + operador humano
---

### [DL-0035]
- Fecha: 2026-03-11
- Estado: aceptada
- Tema: integracion minima y util de pricingResolve en reparaciones admin
- Contexto: el stack nuevo ya tenia backend real de reglas de pricing para reparacion y un endpoint operativo de resolucion automatica, pero el alta y el detalle admin de reparaciones seguian trabajando solo con presupuesto manual. Eso dejaba una capacidad ya migrada sin uso real en la operacion diaria del taller.
- Decision: integrar pricingResolve en AdminRepairCreatePage y AdminRepairDetailPage sin extender todavia el dominio Repair con proveedor o repuesto. La sugerencia se calcula a demanda, queda separada del submit principal, se protege contra respuestas stale y solo impacta el quotedPrice cuando el operador decide usarla explicitamente.
- Impacto: el admin recupera una capacidad util de pricing automatico con alcance controlado, mejora consistencia operativa en presupuestos y aprovecha reglas ya migradas sin abrir aun la fase mas grande de proveedor + repuesto + calculo legacy completo.
- Alternativas consideradas: dejar la feature sin exponer hasta migrar la logica legacy completa o autoescribir el presupuesto al detectar datos suficientes; descartado por desperdiciar una capacidad ya disponible en backend y por generar UX enganosa si el valor sugerido se impusiera sin accion explicita.
- Archivos / modulos afectados: next-stack/apps/web/src/features/repairs/api.ts, next-stack/apps/web/src/features/repairs/repair-pricing.ts, next-stack/apps/web/src/features/repairs/AdminRepairCreatePage.tsx, next-stack/apps/web/src/features/repairs/AdminRepairDetailPage.tsx, project-docs/FRONTEND_QA_HARDENING.md y CHANGELOG_AI.md.
- Validacion requerida: typecheck/build de @nico/api y @nico/web, smoke:backend, smoke:web, qa:route-parity, qa:frontend:e2e y una verificacion dirigida del flujo create/detail -> calcular -> usar sugerido.
- Responsable: Codex + operador humano
---

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

### [DL-0022]
- Fecha: 2026-03-12
- Estado: aceptada
- Tema: busqueda agregada multi-proveedor como flujo principal en reparaciones
- Contexto: la Fase 2 de proveedor + repuesto ya habia integrado preview y snapshot activo, pero la UX seguia empezando por "elegir proveedor" y no recuperaba la experiencia legacy real de buscar una vez y comparar opciones entre proveedores.
- Decision: mantener `searchProviderParts` como fallback puntual, pero pasar el flujo principal de `RepairProviderPartPricingSection` a `searchPartsAcrossProviders`, con un query unico, resultados agregados comparables y un filtro opcional de proveedor como modo secundario.
- Impacto: create y detail de reparaciones ya permiten buscar una sola vez en todos los proveedores activos, elegir una opcion y continuar con preview + snapshot sin perder compatibilidad con la base construida en fases anteriores.
- Alternativas consideradas: seguir con busqueda por proveedor individual como flujo principal; descartado por no recuperar la UX legacy deseada y por obligar al operador a iterar proveedor por proveedor.
- Archivos / modulos afectados: `next-stack/apps/api/src/modules/admin/admin.controller.ts`, `next-stack/apps/api/src/modules/admin/admin.service.ts`, `next-stack/apps/web/src/features/admin/api.ts`, `next-stack/apps/web/src/features/repairs/RepairProviderPartPricingSection.tsx`, `project-docs/REPAIR_PROVIDER_PART_PRICING_PLAN.md`
- Validacion requerida: typecheck/build/smokes/route parity/e2e mas probe dirigido `busqueda unica -> resultados multi-proveedor -> preview -> snapshot`.
- Responsable: Codex + operador humano

### [DL-0023]
- Fecha: 2026-03-12
- Estado: aceptada
- Tema: alta de reparacion simplificada en tres bloques visibles
- Contexto: `AdminRepairCreatePage` habia acumulado demasiados bloques visibles (`cliente/equipo`, catalogo tecnico, sugerencia por reglas, proveedor/repuesto, observaciones, resumen y accion), lo que hacia mas lenta la apertura de un caso de mostrador/taller.
- Decision: reorganizar la vista alrededor de tres bloques principales visibles (`Datos basicos`, `Diagnostico rapido`, `Proveedor y repuesto`) y mover lo secundario a disclosures cerrados por defecto, manteniendo create + preview + snapshot sin cambios de dominio.
- Impacto: la pantalla de alta queda mas rapida de leer y operar, sin perder catalogo exacto, notas, ajustes avanzados ni detalle fino del calculo.
- Alternativas consideradas: mantener la distribucion en sidebar o esconder menos bloques; descartado por no reducir suficientemente el ruido operativo del alta.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/repairs/AdminRepairCreatePage.tsx`, `next-stack/apps/web/src/features/repairs/RepairProviderPartPricingSection.tsx`, `next-stack/apps/web/src/components/ui/section-card.tsx`, `next-stack/apps/web/src/styles.css`.
- Validacion requerida: typecheck/build/smoke web mas probe real `Nueva reparacion -> create`.
- Responsable: Codex + operador humano

### [DL-0024]
- Fecha: 2026-03-13
- Estado: aceptada
- Tema: dashboard admin priorizado para accesos de gestion
- Contexto: el dashboard principal ya habia pasado de mapa general a panel operativo, pero `Gestion principal` seguia demasiado abajo respecto de la frecuencia real de uso.
- Decision: reordenar el dashboard para que `Gestion principal` quede inmediatamente despues de `Acciones rapidas`, antes de `Resumen operativo`, manteniendo `Administracion avanzada` colapsada y sin cambiar la semantica de navegacion.
- Impacto: los accesos diarios a reparaciones, pedidos, productos, categorias, proveedores y pricing quedan mas a mano y dejan de competir con bloques metricos o de seguimiento.
- Alternativas consideradas: mantener `Resumen operativo` como segunda seccion; descartado por menor utilidad directa para el trabajo cotidiano.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/AdminDashboardPage.tsx`
- Validacion requerida: `typecheck`, `build`, `smoke:web` y probe real del dashboard admin.
- Responsable: Codex + operador humano



