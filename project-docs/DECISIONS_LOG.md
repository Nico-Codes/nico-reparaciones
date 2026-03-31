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

### [DL-0043]
- Fecha: 2026-03-13
- Estado: aceptada
- Tema: activar envio real de WhatsApp con Meta Cloud API reutilizando templates/logs/triggers existentes
- Contexto: el proyecto ya tenia templates, logs y triggers automaticos para pedidos, reparaciones y ventas rapidas, pero todo quedaba en estado PENDING sin proveedor real ni actualizacion de entrega. El objetivo de esta fase fue habilitar envio real sin abrir una arquitectura grande nueva.
- Decision: agregar un modulo backend WhatsappModule con WhatsappService para envio inline por Meta Cloud API, extender WhatsAppLog con metadata real de proveedor y entrega, reutilizar el sistema actual de templates como mensaje libre (	ype: text), y exponer un webhook minimo para verificacion y actualizacion de estados salientes. La UI admin de logs pasa a mostrar PENDING, SENT, FAILED, providerStatus, emoteMessageId y errorMessage.
- Impacto: pedidos, reparaciones y ventas rapidas ya no generan solo intencion de envio; ahora disparan envio real cuando hay configuracion valida. El sistema sigue siendo compatible con templates/logs existentes y deja documentada la limitacion actual de Meta para mensajes libres fuera de la ventana de 24 horas.
- Alternativas consideradas: dejar solo logs pendientes o saltar directo a templates aprobados por Meta y una cola/worker dedicada; descartado por no activar envio real ahora o por abrir una fase demasiado grande.
- Archivos / modulos afectados: 
ext-stack/apps/api/prisma/schema.prisma, migracion 20260313130000_add_whatsapp_cloud_api_fields, 
ext-stack/apps/api/src/modules/whatsapp/*, 
ext-stack/apps/api/src/modules/{app,admin,orders,repairs}/*, 
ext-stack/apps/web/src/features/admin/{whatsappApi.ts,AdminWhatsappPage.tsx,AdminWhatsappOrdersPage.tsx,whatsapp-ui.ts}, 
ext-stack/.env.example, 
ext-stack/.env.production.example, 
ext-stack/scripts/env-check.mjs, project-docs/WHATSAPP_CLOUD_API_INTEGRATION.md.
- Validacion requerida: generate + migrate Prisma, typecheck/build de @nico/api y @nico/web, smoke:backend, smoke:web, qa:route-parity, qa:frontend:e2e y probe dirigido con mock local de Meta para SENT, FAILED y webhook.
- Responsable: Codex + operador humano
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

### [DL-0043]
- Fecha: 2026-03-13
- Estado: aceptada
- Tema: activar envio real de WhatsApp con Meta Cloud API reutilizando templates/logs/triggers existentes
- Contexto: el proyecto ya tenia templates, logs y triggers automaticos para pedidos, reparaciones y ventas rapidas, pero todo quedaba en estado PENDING sin proveedor real ni actualizacion de entrega. El objetivo de esta fase fue habilitar envio real sin abrir una arquitectura grande nueva.
- Decision: agregar un modulo backend WhatsappModule con WhatsappService para envio inline por Meta Cloud API, extender WhatsAppLog con metadata real de proveedor y entrega, reutilizar el sistema actual de templates como mensaje libre (	ype: text), y exponer un webhook minimo para verificacion y actualizacion de estados salientes. La UI admin de logs pasa a mostrar PENDING, SENT, FAILED, providerStatus, emoteMessageId y errorMessage.
- Impacto: pedidos, reparaciones y ventas rapidas ya no generan solo intencion de envio; ahora disparan envio real cuando hay configuracion valida. El sistema sigue siendo compatible con templates/logs existentes y deja documentada la limitacion actual de Meta para mensajes libres fuera de la ventana de 24 horas.
- Alternativas consideradas: dejar solo logs pendientes o saltar directo a templates aprobados por Meta y una cola/worker dedicada; descartado por no activar envio real ahora o por abrir una fase demasiado grande.
- Archivos / modulos afectados: 
ext-stack/apps/api/prisma/schema.prisma, migracion 20260313130000_add_whatsapp_cloud_api_fields, 
ext-stack/apps/api/src/modules/whatsapp/*, 
ext-stack/apps/api/src/modules/{app,admin,orders,repairs}/*, 
ext-stack/apps/web/src/features/admin/{whatsappApi.ts,AdminWhatsappPage.tsx,AdminWhatsappOrdersPage.tsx,whatsapp-ui.ts}, 
ext-stack/.env.example, 
ext-stack/.env.production.example, 
ext-stack/scripts/env-check.mjs, project-docs/WHATSAPP_CLOUD_API_INTEGRATION.md.
- Validacion requerida: generate + migrate Prisma, typecheck/build de @nico/api y @nico/web, smoke:backend, smoke:web, qa:route-parity, qa:frontend:e2e y probe dirigido con mock local de Meta para SENT, FAILED y webhook.
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

### [DL-0043]
- Fecha: 2026-03-13
- Estado: aceptada
- Tema: activar envio real de WhatsApp con Meta Cloud API reutilizando templates/logs/triggers existentes
- Contexto: el proyecto ya tenia templates, logs y triggers automaticos para pedidos, reparaciones y ventas rapidas, pero todo quedaba en estado PENDING sin proveedor real ni actualizacion de entrega. El objetivo de esta fase fue habilitar envio real sin abrir una arquitectura grande nueva.
- Decision: agregar un modulo backend WhatsappModule con WhatsappService para envio inline por Meta Cloud API, extender WhatsAppLog con metadata real de proveedor y entrega, reutilizar el sistema actual de templates como mensaje libre (	ype: text), y exponer un webhook minimo para verificacion y actualizacion de estados salientes. La UI admin de logs pasa a mostrar PENDING, SENT, FAILED, providerStatus, emoteMessageId y errorMessage.
- Impacto: pedidos, reparaciones y ventas rapidas ya no generan solo intencion de envio; ahora disparan envio real cuando hay configuracion valida. El sistema sigue siendo compatible con templates/logs existentes y deja documentada la limitacion actual de Meta para mensajes libres fuera de la ventana de 24 horas.
- Alternativas consideradas: dejar solo logs pendientes o saltar directo a templates aprobados por Meta y una cola/worker dedicada; descartado por no activar envio real ahora o por abrir una fase demasiado grande.
- Archivos / modulos afectados: 
ext-stack/apps/api/prisma/schema.prisma, migracion 20260313130000_add_whatsapp_cloud_api_fields, 
ext-stack/apps/api/src/modules/whatsapp/*, 
ext-stack/apps/api/src/modules/{app,admin,orders,repairs}/*, 
ext-stack/apps/web/src/features/admin/{whatsappApi.ts,AdminWhatsappPage.tsx,AdminWhatsappOrdersPage.tsx,whatsapp-ui.ts}, 
ext-stack/.env.example, 
ext-stack/.env.production.example, 
ext-stack/scripts/env-check.mjs, project-docs/WHATSAPP_CLOUD_API_INTEGRATION.md.
- Validacion requerida: generate + migrate Prisma, typecheck/build de @nico/api y @nico/web, smoke:backend, smoke:web, qa:route-parity, qa:frontend:e2e y probe dirigido con mock local de Meta para SENT, FAILED y webhook.
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

### [DL-0043]
- Fecha: 2026-03-13
- Estado: aceptada
- Tema: activar envio real de WhatsApp con Meta Cloud API reutilizando templates/logs/triggers existentes
- Contexto: el proyecto ya tenia templates, logs y triggers automaticos para pedidos, reparaciones y ventas rapidas, pero todo quedaba en estado PENDING sin proveedor real ni actualizacion de entrega. El objetivo de esta fase fue habilitar envio real sin abrir una arquitectura grande nueva.
- Decision: agregar un modulo backend WhatsappModule con WhatsappService para envio inline por Meta Cloud API, extender WhatsAppLog con metadata real de proveedor y entrega, reutilizar el sistema actual de templates como mensaje libre (	ype: text), y exponer un webhook minimo para verificacion y actualizacion de estados salientes. La UI admin de logs pasa a mostrar PENDING, SENT, FAILED, providerStatus, emoteMessageId y errorMessage.
- Impacto: pedidos, reparaciones y ventas rapidas ya no generan solo intencion de envio; ahora disparan envio real cuando hay configuracion valida. El sistema sigue siendo compatible con templates/logs existentes y deja documentada la limitacion actual de Meta para mensajes libres fuera de la ventana de 24 horas.
- Alternativas consideradas: dejar solo logs pendientes o saltar directo a templates aprobados por Meta y una cola/worker dedicada; descartado por no activar envio real ahora o por abrir una fase demasiado grande.
- Archivos / modulos afectados: 
ext-stack/apps/api/prisma/schema.prisma, migracion 20260313130000_add_whatsapp_cloud_api_fields, 
ext-stack/apps/api/src/modules/whatsapp/*, 
ext-stack/apps/api/src/modules/{app,admin,orders,repairs}/*, 
ext-stack/apps/web/src/features/admin/{whatsappApi.ts,AdminWhatsappPage.tsx,AdminWhatsappOrdersPage.tsx,whatsapp-ui.ts}, 
ext-stack/.env.example, 
ext-stack/.env.production.example, 
ext-stack/scripts/env-check.mjs, project-docs/WHATSAPP_CLOUD_API_INTEGRATION.md.
- Validacion requerida: generate + migrate Prisma, typecheck/build de @nico/api y @nico/web, smoke:backend, smoke:web, qa:route-parity, qa:frontend:e2e y probe dirigido con mock local de Meta para SENT, FAILED y webhook.
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

### [DL-0043]
- Fecha: 2026-03-13
- Estado: aceptada
- Tema: activar envio real de WhatsApp con Meta Cloud API reutilizando templates/logs/triggers existentes
- Contexto: el proyecto ya tenia templates, logs y triggers automaticos para pedidos, reparaciones y ventas rapidas, pero todo quedaba en estado PENDING sin proveedor real ni actualizacion de entrega. El objetivo de esta fase fue habilitar envio real sin abrir una arquitectura grande nueva.
- Decision: agregar un modulo backend WhatsappModule con WhatsappService para envio inline por Meta Cloud API, extender WhatsAppLog con metadata real de proveedor y entrega, reutilizar el sistema actual de templates como mensaje libre (	ype: text), y exponer un webhook minimo para verificacion y actualizacion de estados salientes. La UI admin de logs pasa a mostrar PENDING, SENT, FAILED, providerStatus, emoteMessageId y errorMessage.
- Impacto: pedidos, reparaciones y ventas rapidas ya no generan solo intencion de envio; ahora disparan envio real cuando hay configuracion valida. El sistema sigue siendo compatible con templates/logs existentes y deja documentada la limitacion actual de Meta para mensajes libres fuera de la ventana de 24 horas.
- Alternativas consideradas: dejar solo logs pendientes o saltar directo a templates aprobados por Meta y una cola/worker dedicada; descartado por no activar envio real ahora o por abrir una fase demasiado grande.
- Archivos / modulos afectados: 
ext-stack/apps/api/prisma/schema.prisma, migracion 20260313130000_add_whatsapp_cloud_api_fields, 
ext-stack/apps/api/src/modules/whatsapp/*, 
ext-stack/apps/api/src/modules/{app,admin,orders,repairs}/*, 
ext-stack/apps/web/src/features/admin/{whatsappApi.ts,AdminWhatsappPage.tsx,AdminWhatsappOrdersPage.tsx,whatsapp-ui.ts}, 
ext-stack/.env.example, 
ext-stack/.env.production.example, 
ext-stack/scripts/env-check.mjs, project-docs/WHATSAPP_CLOUD_API_INTEGRATION.md.
- Validacion requerida: generate + migrate Prisma, typecheck/build de @nico/api y @nico/web, smoke:backend, smoke:web, qa:route-parity, qa:frontend:e2e y probe dirigido con mock local de Meta para SENT, FAILED y webhook.
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

### [DL-0043]
- Fecha: 2026-03-13
- Estado: aceptada
- Tema: activar envio real de WhatsApp con Meta Cloud API reutilizando templates/logs/triggers existentes
- Contexto: el proyecto ya tenia templates, logs y triggers automaticos para pedidos, reparaciones y ventas rapidas, pero todo quedaba en estado PENDING sin proveedor real ni actualizacion de entrega. El objetivo de esta fase fue habilitar envio real sin abrir una arquitectura grande nueva.
- Decision: agregar un modulo backend WhatsappModule con WhatsappService para envio inline por Meta Cloud API, extender WhatsAppLog con metadata real de proveedor y entrega, reutilizar el sistema actual de templates como mensaje libre (	ype: text), y exponer un webhook minimo para verificacion y actualizacion de estados salientes. La UI admin de logs pasa a mostrar PENDING, SENT, FAILED, providerStatus, emoteMessageId y errorMessage.
- Impacto: pedidos, reparaciones y ventas rapidas ya no generan solo intencion de envio; ahora disparan envio real cuando hay configuracion valida. El sistema sigue siendo compatible con templates/logs existentes y deja documentada la limitacion actual de Meta para mensajes libres fuera de la ventana de 24 horas.
- Alternativas consideradas: dejar solo logs pendientes o saltar directo a templates aprobados por Meta y una cola/worker dedicada; descartado por no activar envio real ahora o por abrir una fase demasiado grande.
- Archivos / modulos afectados: 
ext-stack/apps/api/prisma/schema.prisma, migracion 20260313130000_add_whatsapp_cloud_api_fields, 
ext-stack/apps/api/src/modules/whatsapp/*, 
ext-stack/apps/api/src/modules/{app,admin,orders,repairs}/*, 
ext-stack/apps/web/src/features/admin/{whatsappApi.ts,AdminWhatsappPage.tsx,AdminWhatsappOrdersPage.tsx,whatsapp-ui.ts}, 
ext-stack/.env.example, 
ext-stack/.env.production.example, 
ext-stack/scripts/env-check.mjs, project-docs/WHATSAPP_CLOUD_API_INTEGRATION.md.
- Validacion requerida: generate + migrate Prisma, typecheck/build de @nico/api y @nico/web, smoke:backend, smoke:web, qa:route-parity, qa:frontend:e2e y probe dirigido con mock local de Meta para SENT, FAILED y webhook.
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

### [DL-0043]
- Fecha: 2026-03-13
- Estado: aceptada
- Tema: activar envio real de WhatsApp con Meta Cloud API reutilizando templates/logs/triggers existentes
- Contexto: el proyecto ya tenia templates, logs y triggers automaticos para pedidos, reparaciones y ventas rapidas, pero todo quedaba en estado PENDING sin proveedor real ni actualizacion de entrega. El objetivo de esta fase fue habilitar envio real sin abrir una arquitectura grande nueva.
- Decision: agregar un modulo backend WhatsappModule con WhatsappService para envio inline por Meta Cloud API, extender WhatsAppLog con metadata real de proveedor y entrega, reutilizar el sistema actual de templates como mensaje libre (	ype: text), y exponer un webhook minimo para verificacion y actualizacion de estados salientes. La UI admin de logs pasa a mostrar PENDING, SENT, FAILED, providerStatus, emoteMessageId y errorMessage.
- Impacto: pedidos, reparaciones y ventas rapidas ya no generan solo intencion de envio; ahora disparan envio real cuando hay configuracion valida. El sistema sigue siendo compatible con templates/logs existentes y deja documentada la limitacion actual de Meta para mensajes libres fuera de la ventana de 24 horas.
- Alternativas consideradas: dejar solo logs pendientes o saltar directo a templates aprobados por Meta y una cola/worker dedicada; descartado por no activar envio real ahora o por abrir una fase demasiado grande.
- Archivos / modulos afectados: 
ext-stack/apps/api/prisma/schema.prisma, migracion 20260313130000_add_whatsapp_cloud_api_fields, 
ext-stack/apps/api/src/modules/whatsapp/*, 
ext-stack/apps/api/src/modules/{app,admin,orders,repairs}/*, 
ext-stack/apps/web/src/features/admin/{whatsappApi.ts,AdminWhatsappPage.tsx,AdminWhatsappOrdersPage.tsx,whatsapp-ui.ts}, 
ext-stack/.env.example, 
ext-stack/.env.production.example, 
ext-stack/scripts/env-check.mjs, project-docs/WHATSAPP_CLOUD_API_INTEGRATION.md.
- Validacion requerida: generate + migrate Prisma, typecheck/build de @nico/api y @nico/web, smoke:backend, smoke:web, qa:route-parity, qa:frontend:e2e y probe dirigido con mock local de Meta para SENT, FAILED y webhook.
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

### [DL-0043]
- Fecha: 2026-03-13
- Estado: aceptada
- Tema: activar envio real de WhatsApp con Meta Cloud API reutilizando templates/logs/triggers existentes
- Contexto: el proyecto ya tenia templates, logs y triggers automaticos para pedidos, reparaciones y ventas rapidas, pero todo quedaba en estado PENDING sin proveedor real ni actualizacion de entrega. El objetivo de esta fase fue habilitar envio real sin abrir una arquitectura grande nueva.
- Decision: agregar un modulo backend WhatsappModule con WhatsappService para envio inline por Meta Cloud API, extender WhatsAppLog con metadata real de proveedor y entrega, reutilizar el sistema actual de templates como mensaje libre (	ype: text), y exponer un webhook minimo para verificacion y actualizacion de estados salientes. La UI admin de logs pasa a mostrar PENDING, SENT, FAILED, providerStatus, emoteMessageId y errorMessage.
- Impacto: pedidos, reparaciones y ventas rapidas ya no generan solo intencion de envio; ahora disparan envio real cuando hay configuracion valida. El sistema sigue siendo compatible con templates/logs existentes y deja documentada la limitacion actual de Meta para mensajes libres fuera de la ventana de 24 horas.
- Alternativas consideradas: dejar solo logs pendientes o saltar directo a templates aprobados por Meta y una cola/worker dedicada; descartado por no activar envio real ahora o por abrir una fase demasiado grande.
- Archivos / modulos afectados: 
ext-stack/apps/api/prisma/schema.prisma, migracion 20260313130000_add_whatsapp_cloud_api_fields, 
ext-stack/apps/api/src/modules/whatsapp/*, 
ext-stack/apps/api/src/modules/{app,admin,orders,repairs}/*, 
ext-stack/apps/web/src/features/admin/{whatsappApi.ts,AdminWhatsappPage.tsx,AdminWhatsappOrdersPage.tsx,whatsapp-ui.ts}, 
ext-stack/.env.example, 
ext-stack/.env.production.example, 
ext-stack/scripts/env-check.mjs, project-docs/WHATSAPP_CLOUD_API_INTEGRATION.md.
- Validacion requerida: generate + migrate Prisma, typecheck/build de @nico/api y @nico/web, smoke:backend, smoke:web, qa:route-parity, qa:frontend:e2e y probe dirigido con mock local de Meta para SENT, FAILED y webhook.
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

### [DL-0025]
- Fecha: 2026-03-13
- Estado: aceptada
- Tema: validacion real de WhatsApp Cloud API bloqueada por entorno sin credenciales
- Contexto: la integracion real con Meta Cloud API ya quedo implementada, pero la fase de validacion real encontro que el entorno local no tiene cargadas variables `WHATSAPP_CLOUD_*` ni un webhook publico alcanzable por Meta.
- Decision: no simular una validacion real inexistente; dejar documentado que el sistema esta listo tecnicamente, mantener el gate del proyecto en verde y exigir como siguiente paso operativo cargar credenciales reales + URL publica antes de declarar la integracion validada contra Meta.
- Impacto: evita una falsa sensacion de cierre. La implementacion sigue usable y estable, pero la validacion end-to-end contra Meta real queda explicitamente pendiente de entorno y no de codigo.
- Alternativas consideradas: intentar forzar pruebas con mocks o credenciales inexistentes; descartado por no cumplir el criterio de validacion real solicitado.
- Archivos / modulos afectados: `project-docs/WHATSAPP_CLOUD_API_INTEGRATION.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`
- Validacion requerida: `typecheck`, `build`, `smoke:backend`, `smoke:web`, `qa:route-parity`, `qa:frontend:e2e`.
- Responsable: Codex + operador humano

### [DL-0026]
- Fecha: 2026-03-16
- Estado: aceptada
- Tema: `nico-dev.bat start/stop` gestiona tambien el tunel ngrok del frontend
- Contexto: se necesita abrir rapidamente la web de desarrollo en un celular sin repetir arranque manual de `ngrok` ni recordar el comando correcto sobre Vite `5174`.
- Decision: extender `nico-dev.bat` para que `start` levante API + Web + un tunel `ngrok` al puerto `5174` cuando exista `ngrok` configurado por archivo local o `NGROK_AUTHTOKEN`, imprima la URL publica y deje `stop` encargado de cerrar tambien ese tunel.
- Impacto: el flujo operativo de desarrollo desde la raiz queda mas corto y consistente para pruebas en dispositivos moviles, sin tocar backend ni el runtime del frontend.
- Alternativas consideradas: mantener `ngrok` como paso manual separado; descartado por friccion operativa y por repeticion innecesaria en el ciclo diario.
- Archivos / modulos afectados: `nico-dev.bat`, `README.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: ejecutar `nico-dev.bat start`, verificar health de API/Web, verificar `ngrok` en `http://127.0.0.1:4040/api/tunnels` y luego `nico-dev.bat stop`.
- Responsable: Codex + operador humano

### [DL-0027]
- Fecha: 2026-03-30
- Estado: aceptada
- Tema: primera ola de cleanup estructural sin renombrar `next-stack/`
- Contexto: el repo ya tenia un stack canonico claro, pero la documentacion viva, los runbooks y los scripts seguian demasiado planos, y habia ruido transitorio visible en superficie. Ademas, `App.tsx` y `admin.service.ts` concentraban definiciones estructurales que convenia separar sin tocar contratos publicos.
- Decision: ejecutar una primera ola de limpieza conservadora: mover `project-docs/` a una taxonomia por dominios, mover `next-stack/docs/` a una taxonomia de runbooks, separar `next-stack/scripts/` por proposito manteniendo los scripts npm publicos, reforzar ignores para logs temporales, extraer el routing auxiliar de `App.tsx` y formalizar un registro tipado de `AppSetting`. Se decide no renombrar `next-stack/` en esta fase.
- Impacto: el repo queda mas legible y mas simple de navegar, sin cambios deliberados en rutas publicas, endpoints ni nombres de variables de entorno. La limpieza futura gana una base mas segura porque ya existen limites fisicos y semanticos mas claros.
- Alternativas consideradas: renombrar `next-stack/` en la misma ola; descartado por blast radius alto sobre CI, README, scripts y documentacion.
- Archivos / modulos afectados: `project-docs/INDEX.md`, `project-docs/plans/REPO_CLEANUP_POLICY.md`, `next-stack/docs/INDEX.md`, `next-stack/package.json`, `next-stack/apps/web/src/App.tsx`, `next-stack/apps/web/src/layouts/AppShell.tsx`, `next-stack/apps/api/src/modules/admin/admin.service.ts`, `next-stack/apps/api/src/modules/admin/app-settings.registry.ts`, `next-stack/packages/contracts/src/index.ts`.
- Validacion requerida: `env:check`, `typecheck` API/Web, `build` API/Web, `qa:route-parity`, `qa:legacy:detach`, `smoke:web`.
- Responsable: Codex + operador humano

### [DL-0028]
- Fecha: 2026-03-30
- Estado: aceptada
- Tema: automatizar el cierre de tareas con una skill global en lugar de tooling dentro del repo
- Contexto: se quiere que Codex repita el flujo de commit versionado + push en este proyecto sin ensuciar el repositorio con comandos locales, scripts operativos o batchs adicionales.
- Decision: crear la skill global `repo-ship` en `$CODEX_HOME/skills` y declarar en `AGENTS.md` que, al cerrar tareas con cambios de codigo, Codex debe usar esa skill para hacer stage/commit/push con formato `V1.xxx-DetalleCorto`, siempre separando cambios ajenos y respetando las validaciones de la tarea. Se descarta la automatizacion basada en scripts dentro del repo.
- Impacto: el comportamiento queda persistente para futuras sesiones de Codex en este repo, sin agregar ruido al arbol de codigo ni introducir tooling operativo extra dentro del proyecto.
- Alternativas consideradas: `nico-dev.bat ship` + `scripts/git-ship.ps1`; descartado por mezclar automatizacion de Codex con archivos propios del repositorio.
- Archivos / modulos afectados: `AGENTS.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`, skill global `C:\Users\nicol\.codex\skills\repo-ship\`.
- Validacion requerida: crear la skill con `init_skill.py` y validar con `quick_validate.py`.
- Responsable: Codex + operador humano

### [DL-0029]
- Fecha: 2026-03-30
- Estado: aceptada
- Tema: separar reglas cortas de Codex, metodologia operativa y router documental
- Contexto: `AGENTS.md` ya era la regla persistente del repo, pero necesitaba ser mas corto, estable y normativo. La metodologia detallada y la politica documental no debian seguir mezcladas ni implicitas.
- Decision: mantener `AGENTS.md` como contrato operativo breve, mover el detalle metodologico a `project-docs/WORKFLOW_AI.md` y endurecer `project-docs/INDEX.md` como router documental unico. Se adopta como metodologia por defecto: explorar primero, preguntar solo ante ambiguedad material, exponer tradeoffs antes de cambios relevantes, refactorizar el subdominio afectado cuando mejore claridad, validar segun impacto y usar `nico-dev.bat` solo cuando aporte validacion real.
- Impacto: Codex gana un flujo de trabajo mas consistente y predecible, y la documentacion del repo queda mas ordenada y menos dispersa. Tambien se reduce el riesgo de usar `AGENTS.md` como documento enciclopedico.
- Alternativas consideradas: concentrar todo en `AGENTS.md`; descartado por volverlo demasiado largo y menos mantenible.
- Archivos / modulos afectados: `AGENTS.md`, `project-docs/WORKFLOW_AI.md`, `project-docs/INDEX.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: revisar consistencia entre `AGENTS.md`, `WORKFLOW_AI.md` e `INDEX.md`, y verificar que la politica declarada para `nico-dev.bat` coincida con su uso operativo actual.
- Responsable: Codex + operador humano

### [DL-0044]
- Fecha: 2026-03-30
- Estado: aceptada
- Tema: primera ola de hardening estructural con test harness comun, controllers mas finos y storage encapsulado
- Contexto: el stack actual era correcto, pero seguia demasiado apoyado en archivos grandes, validacion inline en controllers y escritura local de assets repartida entre servicios de dominio. Eso hacia mas riesgosa cualquier limpieza posterior.
- Decision: agregar Vitest como runner comun del monorepo, extraer schemas Zod de `admin`, `orders`, `repairs` y `pricing` a archivos `*.schemas.ts`, introducir `zod-bad-request` como helper comun, encapsular assets locales en `PublicAssetStorageService`, mover branding/settings/dashboard a subservicios admin y dejar `AdminService` como facade parcial. Tambien se decide sanear texto roto al serializar `whatsapp-logs` para que el backend no siga propagando mojibake historico.
- Impacto: la validacion deja de depender solo de build/smoke, los controllers quedan mas simples, los assets dejan de duplicar logica de path/extension y el backend gana una primera particion interna sin cambiar endpoints ni variables de entorno.
- Alternativas consideradas: seguir limpiando solo por archivos grandes o saltar directo a partir `repairs.service.ts` y `orders.service.ts`; descartado por falta de red de seguridad suficiente y por mezclar demasiados riesgos en una sola ola.
- Archivos / modulos afectados: `.github/workflows/ci.yml`, `next-stack/package.json`, `next-stack/apps/{api,web}/package.json`, `next-stack/packages/contracts/package.json`, `next-stack/apps/api/src/common/{http,storage}/*`, `next-stack/apps/api/src/modules/admin/*`, `next-stack/apps/api/src/modules/catalog-admin/*`, `next-stack/apps/api/src/modules/{orders,pricing,repairs}/*controller.ts`, `next-stack/apps/web/src/features/repairs/repair-pricing.test.ts`, `next-stack/packages/contracts/src/index.test.ts`, `project-docs/architecture/{ARCHITECTURE.md,ASSET_STRATEGY.md}`.
- Validacion requerida: `env:check`, `typecheck` API/Web, `build` API/Web, `test` monorepo, `qa:route-parity`, `qa:legacy:detach`, `smoke:backend`, `smoke:web`.
- Responsable: Codex + operador humano

### [DL-0045]
- Fecha: 2026-03-30
- Estado: aceptada
- Tema: cierre parcial de tareas siempre con siguiente paso recomendado
- Contexto: aun con una metodologia mas ordenada, algunas tareas pueden cerrarse sin quedar completas en su totalidad. Eso deja al operador sin una continuidad explicita y hace mas facil que el trabajo quede en estado ambiguo.
- Decision: incorporar como regla permanente que, cuando una tarea no quede terminada por completo, Codex debe cerrar la respuesta con el siguiente paso concreto o la recomendacion prioritaria para finalizarla.
- Impacto: mejora la continuidad operativa entre turnos, reduce cierres abiertos y deja mas claro que queda pendiente despues de cada entrega parcial.
- Alternativas consideradas: dejar la recomendacion como buena practica informal; descartado por inconsistencia y porque depende demasiado del criterio del turno.
- Archivos / modulos afectados: `AGENTS.md`, `project-docs/WORKFLOW_AI.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: revisar consistencia entre reglas del repo y metodologia detallada, y verificar diff limpio.
- Responsable: Codex + operador humano

### [DL-0046]
- Fecha: 2026-03-30
- Estado: aceptada
- Tema: tareas bloqueadas deben cerrar con bloqueo explicito y decision minima pendiente
- Contexto: incluso cuando una tarea no puede completarse por ambiguedad, riesgo o falta de definicion del usuario, el cierre no debe quedar difuso. Sin una explicacion concreta del bloqueo, el siguiente turno arranca con perdida de contexto y mas friccion.
- Decision: incorporar como regla permanente que, si una tarea queda bloqueada o depende de una definicion externa, Codex debe explicitar el bloqueo real y la decision minima necesaria para destrabarla.
- Impacto: mejora la continuidad entre turnos, evita cierres vagos y hace mas claro cuando el repo ya no es el problema y falta una definicion operativa o de producto.
- Alternativas consideradas: tratarlo como extension informal de la regla de cierre parcial; descartado porque el tipo de bloqueo merece una salida mas precisa que un simple "siguiente paso".
- Archivos / modulos afectados: `AGENTS.md`, `project-docs/WORKFLOW_AI.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: revisar consistencia entre contrato operativo y metodologia detallada, y verificar diff limpio.
- Responsable: Codex + operador humano

### [DL-0047]
- Fecha: 2026-03-30
- Estado: aceptada
- Tema: multiples opciones deben cerrar con recomendacion priorizada
- Contexto: en tareas de analisis, bloqueos o entregas parciales puede haber varias alternativas razonables para seguir. Si solo se enumeran opciones sin priorizarlas, el usuario queda con mas trabajo de decision y el flujo pierde consistencia.
- Decision: incorporar como regla permanente que, cuando existan varias opciones razonables, Codex debe recomendar una como opcion prioritaria y justificarla con un criterio breve y operativo.
- Impacto: reduce ambiguedad, acelera la toma de decisiones y mantiene una metodologia mas consistente entre turnos y entregas parciales.
- Alternativas consideradas: listar opciones sin priorizacion; descartado porque delega demasiado criterio al usuario incluso cuando hay una recomendacion tecnica defendible.
- Archivos / modulos afectados: `AGENTS.md`, `project-docs/WORKFLOW_AI.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: revisar consistencia entre contrato operativo y metodologia detallada, y verificar diff limpio.
- Responsable: Codex + operador humano

### [DL-0048]
- Fecha: 2026-03-30
- Estado: aceptada
- Tema: `RepairsModule` pasa de servicio monolitico a facade con subservicios internos
- Contexto: despues de la primera ola de hardening, `repairs.service.ts` seguia siendo uno de los hotspots mas grandes del backend y mezclaba flujo publico, flujo admin, snapshots de pricing, timeline, serializacion y notificaciones. Eso hacia mas riesgoso seguir limpiando backend o expandir contratos.
- Decision: mantener `RepairsController` y las rutas estables, pero partir la implementacion interna en una facade chica (`repairs.service.ts`) y subservicios por responsabilidad: `repairs-admin.service.ts`, `repairs-public.service.ts`, `repairs-pricing.service.ts`, `repairs-notifications.service.ts`, `repairs-support.service.ts` y `repairs-timeline.service.ts`. Tambien se extraen tipos y helpers compartidos, y se agrega test unitario para helpers del dominio.
- Impacto: el hotspot principal baja de mas de 1200 lineas a una facade de 60 lineas, el modulo gana limites mas claros y la siguiente ola sobre `orders.service.ts`, contracts y frontend queda menos riesgosa. No hay cambios deliberados en endpoints ni payloads publicos.
- Alternativas consideradas: partir primero `orders.service.ts` o hacer solo un corte cosmetico por helpers dentro del mismo archivo; descartado porque `repairs` era el hotspot mas urgente y un corte parcial dentro del mismo archivo no resolvia el problema de responsabilidad mezclada.
- Archivos / modulos afectados: `next-stack/apps/api/src/modules/repairs/*`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/backend/BACKEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/api`, `test --workspace @nico/api`, `build --workspace @nico/api`, `smoke:backend`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0049]
- Fecha: 2026-03-30
- Estado: aceptada
- Tema: `OrdersModule` pasa de servicio monolitico a facade con subservicios internos
- Contexto: una vez partido `RepairsModule`, `orders.service.ts` quedo como el siguiente hotspot claro del backend. Mezclaba checkout, mis pedidos, admin, ventas rapidas, reglas de estado, stock, serializacion y logs de WhatsApp en un solo archivo.
- Decision: mantener `OrdersController` y las rutas estables, pero dividir la implementacion interna en una facade chica (`orders.service.ts`) y subservicios por responsabilidad: `orders-checkout.service.ts`, `orders-admin.service.ts`, `orders-quick-sales.service.ts`, `orders-notifications.service.ts` y `orders-support.service.ts`. Tambien se extraen tipos y helpers compartidos, y se agrega test unitario para helpers del dominio.
- Impacto: el hotspot principal baja de mas de 700 lineas a una facade de 46 lineas, el backend gana separacion mas clara entre flujo cliente, admin y venta rapida, y la siguiente ola sobre contracts/frontend queda menos riesgosa. No hay cambios deliberados en endpoints ni payloads publicos.
- Alternativas consideradas: saltar directo a contracts o frontend; descartado porque `orders` seguia siendo un hotspot estructural del backend y convenia resolverlo antes de expandir fronteras compartidas.
- Archivos / modulos afectados: `next-stack/apps/api/src/modules/orders/*`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/backend/BACKEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/api`, `test --workspace @nico/api`, `build --workspace @nico/api`, `smoke:backend`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0050]
- Fecha: 2026-03-30
- Estado: aceptada
- Tema: `AdminModule` empieza a separarse por subdominios internos, empezando por `providers`
- Contexto: despues de partir `RepairsModule` y `OrdersModule`, el hotspot mas grande que quedaba en backend era `admin.service.ts`. Ese archivo seguia mezclando dashboard, settings, branding, proveedores, warranties, accounting, templates y logs en una sola clase, lo que hacia que cualquier cambio admin tuviera demasiado alcance colateral.
- Decision: mantener `AdminController` y las rutas estables, pero extraer el subdominio de proveedores a `admin-providers.service.ts`, dejando `admin.service.ts` como fachada para los endpoints `/admin/providers*`. La logica de CRUD, probe y busqueda de repuestos queda encapsulada en el nuevo subservicio y el modulo registra explicitamente esta dependencia.
- Impacto: `AdminService` baja de tamaño real y deja de concentrar scraping/parsing HTML/JSON, stats de proveedores y persistencia del registro de suppliers. El siguiente corte sobre comunicaciones/templates o warranties/accounting queda mas claro y menos riesgoso. No hay cambios deliberados en endpoints, payloads ni variables de entorno.
- Alternativas consideradas: partir primero warranties/accounting o hacer una limpieza cosmetica dentro del mismo `admin.service.ts`; descartado porque `providers` era el bloque mas cohesivo y grande dentro del modulo, y moverlo primero da la mayor reduccion de complejidad con menor riesgo.
- Archivos / modulos afectados: `next-stack/apps/api/src/modules/admin/{admin.module.ts,admin.service.ts,admin-providers.service.ts}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/backend/BACKEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/api`, `test --workspace @nico/api`, `build --workspace @nico/api`, `smoke:backend`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0051]
- Fecha: 2026-03-30
- Estado: aceptada
- Tema: `AdminModule` extrae comunicaciones, templates y reportes a un subservicio dedicado
- Contexto: despues de separar `providers`, `admin.service.ts` seguia mezclando reportes operativos, estado SMTP, templates de mail, templates/logs de WhatsApp y saneo de texto historico con el resto del backoffice. Ese bloque era cohesivo, transversal y seguia haciendo crecer la fachada admin mas de lo necesario.
- Decision: mantener `AdminController` y las rutas estables, pero mover reportes, SMTP, templates de mail, templates/logs de WhatsApp y helpers asociados a `admin-communications.service.ts`, dejando `admin.service.ts` como fachada para esos endpoints. Tambien se agrega test unitario para saneo de mojibake y defaults de templates WhatsApp.
- Impacto: `AdminService` baja otra porcion importante de complejidad y el dominio de comunicaciones queda mas testeable y aislado del resto del admin. No hay cambios deliberados en endpoints, payloads ni variables de entorno.
- Alternativas consideradas: partir primero `warranties`/`accounting` o hacer solo una limpieza cosmetica dentro del mismo archivo; descartado porque comunicaciones era el bloque mas cohesivo y facil de validar sin tocar contratos.
- Archivos / modulos afectados: `next-stack/apps/api/src/modules/admin/{admin.module.ts,admin.service.ts,admin-communications.service.ts,admin-communications.service.test.ts}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/backend/BACKEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/api`, `test --workspace @nico/api`, `build --workspace @nico/api`, `smoke:backend`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0052]
- Fecha: 2026-03-30
- Estado: aceptada
- Tema: `AdminModule` extrae warranties/accounting y centraliza la lectura del registro de incidentes
- Contexto: despues de separar `providers` y `communications`, `admin.service.ts` seguia mezclando warranties, accounting, filtros de fechas y lectura del registro de incidentes. Al mismo tiempo, `admin-providers.service.ts` habia quedado con una duplicacion de la misma lectura de `warrantyIncident`, lo que seguia esparciendo logica comun dentro del modulo admin.
- Decision: crear `admin-warranty-registry.service.ts` como punto unico para leer y normalizar incidentes de garantia, mover `warranties`, `createWarranty`, `closeWarranty` y `accounting` a `admin-finance.service.ts`, y hacer que `admin-providers.service.ts` consuma el registro compartido en lugar de reimplementar esa lectura.
- Impacto: `AdminService` baja otra porcion grande de complejidad, providers deja de duplicar acceso al registro de incidentes y el dominio de warranties/accounting queda mejor aislado para futuras pruebas o cortes internos. No hay cambios deliberados en endpoints, payloads ni variables de entorno.
- Alternativas consideradas: partir `warranties` y `accounting` por separado o moverlos sin centralizar el registro; descartado porque dejaba acople artificial entre servicios y mantenia duplicacion innecesaria en providers.
- Archivos / modulos afectados: `next-stack/apps/api/src/modules/admin/{admin.module.ts,admin.service.ts,admin-providers.service.ts,admin-finance.service.ts,admin-finance.service.test.ts,admin-warranty-registry.service.ts,admin-warranty-registry.service.test.ts,admin-warranty-registry.types.ts}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/backend/BACKEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `env:check`, `typecheck --workspace @nico/api`, `test --workspace @nico/api`, `build --workspace @nico/api`, `smoke:backend`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0053]
- Fecha: 2026-03-30
- Estado: aceptada
- Tema: el subdominio `providers` pasa a `facade + registry + search`
- Contexto: despues de centralizar warranties/accounting, el siguiente hotspot claro del backend era `admin-providers.service.ts`. Mezclaba CRUD del registro de proveedores, stats, reorder, import de seeds, probe HTTP, scraping HTML/JSON, normalizacion de partes y ranking de resultados en un solo archivo.
- Decision: mantener `AdminProvidersService` como fachada publica de `/admin/providers*`, mover CRUD/registro/stats a `admin-provider-registry.service.ts`, mover probe/busqueda/scraping/ranking a `admin-provider-search.service.ts` y compartir tipos del subdominio en `admin-providers.types.ts`.
- Impacto: el archivo publico `admin-providers.service.ts` baja a una fachada muy chica, el modulo gana limites mas claros y la limpieza futura puede atacar el hotspot real de scraping sin mezclarlo con el registro de proveedores. No hay cambios deliberados en endpoints, payloads ni variables de entorno.
- Alternativas consideradas: seguir agregando helpers dentro del mismo archivo o partir primero frontend; descartado porque `providers` seguia siendo el hotspot backend mas grande y el corte por capas da mejor relacion riesgo/beneficio.
- Archivos / modulos afectados: `next-stack/apps/api/src/modules/admin/{admin.module.ts,admin-providers.service.ts,admin-provider-registry.service.ts,admin-provider-search.service.ts,admin-providers.types.ts,admin-provider-registry.service.test.ts,admin-provider-search.service.test.ts}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/backend/BACKEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `env:check`, `typecheck --workspace @nico/api`, `test --workspace @nico/api`, `build --workspace @nico/api`, `smoke:backend`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0054]
- Fecha: 2026-03-30
- Estado: aceptada
- Tema: `admin-provider-search` pasa de servicio hotspot a orquestador con helpers puros
- Contexto: despues de separar `providers` en facade + registry + search, el nuevo hotspot claro quedo concentrado dentro de `admin-provider-search.service.ts`. Ese archivo seguia mezclando fetch HTTP, parsing HTML/JSON, heuristicas de nombres/availability, normalizacion de precios y ranking de resultados.
- Decision: mantener `AdminProviderSearchService` como orquestador del flujo de busqueda y persistencia del probe, pero mover la logica pura a `admin-provider-search.parsers.ts`, `admin-provider-search-ranking.ts` y `admin-provider-search.text.ts`. Los endpoints `/admin/providers/:id/probe`, `/admin/providers/:id/search-parts` y `/admin/providers/search-parts` se mantienen estables.
- Impacto: el servicio baja a unas 330 lineas, el parsing queda seccionado por responsabilidad y la siguiente limpieza puede apuntar a hotspots reales como `catalog-admin.service.ts` o frontend sin volver a tocar el contrato del subdominio de proveedores.
- Alternativas consideradas: dejar helpers privados dentro del mismo archivo o seguir partiendo `providers` sin extraer ranking/text utils; descartado porque no resolvia el problema de lectura ni hacia mas testeable la logica pura.
- Archivos / modulos afectados: `next-stack/apps/api/src/modules/admin/{admin-provider-search.service.ts,admin-provider-search.parsers.ts,admin-provider-search-ranking.ts,admin-provider-search.text.ts,admin-provider-search.service.test.ts}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/backend/BACKEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/api`, `test --workspace @nico/api`, `build --workspace @nico/api`, `smoke:backend`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0055]
- Fecha: 2026-03-30
- Estado: aceptada
- Tema: `CatalogAdminModule` pasa de servicio monolitico a facade con subservicios internos
- Contexto: `catalog-admin.service.ts` seguia mezclando categorias, productos, imagenes, pricing de productos, lectura/escritura de settings y validaciones compartidas en un solo archivo de mas de 700 lineas. Eso dejaba al modulo comercial/admin como el siguiente hotspot natural del backend.
- Decision: mantener `CatalogAdminController` y las rutas estables, pero partir la implementacion interna en una facade chica (`catalog-admin.service.ts`) y subservicios por responsabilidad: `catalog-admin-categories.service.ts`, `catalog-admin-products.service.ts`, `catalog-admin-pricing.service.ts` y `catalog-admin-support.service.ts`, mas tipos compartidos en `catalog-admin.types.ts`.
- Impacto: el servicio publico baja a menos de 100 lineas, el modulo gana limites internos claros entre catalogo, assets y pricing, y se reduce el riesgo de seguir limpiando backend o contracts sin tocar el contrato HTTP de `catalog-admin`.
- Alternativas consideradas: dejar helpers privados dentro del mismo archivo o partir solo `pricing`; descartado porque seguia dejando mezclado el flujo de productos e imagenes y no resolvia la lectura global del modulo.
- Archivos / modulos afectados: `next-stack/apps/api/src/modules/catalog-admin/*`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/backend/BACKEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `env:check`, `typecheck --workspace @nico/api`, `test --workspace @nico/api`, `build --workspace @nico/api`, `smoke:backend`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0056]
- Fecha: 2026-03-30
- Estado: aceptada
- Tema: `RepairProviderPartPricingSection` pasa de hotspot monolitico a orquestador con helpers y subpanels
- Contexto: despues de bajar los hotspots fuertes del backend, el archivo mas grande y mas riesgoso del repo completo seguia en frontend dentro de `RepairProviderPartPricingSection.tsx`. Ese archivo mezclaba carga de proveedores, busqueda agregada de repuestos, seleccion de supplier/part, preview de pricing, snapshot activo, historial, mensajes de estado y render de toda la UI en una sola pieza.
- Decision: mantener la API del componente y el flujo funcional estable, pero repartir la implementacion en un orquestador principal (`RepairProviderPartPricingSection.tsx`) y piezas chicas por responsabilidad: `repair-provider-part-pricing-section.helpers.ts`, `repair-provider-part-pricing-section.search.tsx`, `repair-provider-part-pricing-section.preview.tsx` y `repair-provider-part-pricing-section.snapshot.tsx`. Tambien se agrega test unitario para helpers del subdominio.
- Impacto: el hotspot principal del frontend baja de mas de mil lineas a unas 450, la lectura del flujo create/detail queda mucho mas clara y el siguiente corte sobre `AdminRepairDetailPage.tsx` o contracts de repairs se vuelve menos riesgoso. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: seguir agregando helpers privados dentro del mismo archivo o saltar primero a `AdminRepairDetailPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en partir la pieza compartida de proveedor + repuesto + preview sin abrir mas superficie de UI.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/repairs/{RepairProviderPartPricingSection.tsx,repair-provider-part-pricing-section.helpers.ts,repair-provider-part-pricing-section.helpers.test.ts,repair-provider-part-pricing-section.search.tsx,repair-provider-part-pricing-section.preview.tsx,repair-provider-part-pricing-section.snapshot.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0057]
- Fecha: 2026-03-30
- Estado: aceptada
- Tema: `AdminRepairDetailPage` pasa de pagina hotspot a orquestador con helpers y sections
- Contexto: despues de partir `RepairProviderPartPricingSection`, el siguiente hotspot mas grande del frontend en `repairs` quedo concentrado en `AdminRepairDetailPage.tsx`. Esa pagina mezclaba carga del caso, diff del patch, validaciones, recalculo de sugerencia, formulario completo, stats, timeline e historial en un solo archivo de mas de 700 lineas.
- Decision: mantener la ruta y el flujo del detalle admin estables, pero mover parseo/validacion/diff del patch a `admin-repair-detail.helpers.ts`, mover la UI seccionada a `admin-repair-detail.sections.tsx` y dejar `AdminRepairDetailPage.tsx` como orquestador de estado, requests y guardado. Tambien se agrega test unitario para helpers del detalle.
- Impacto: `AdminRepairDetailPage.tsx` baja a unas 450 lineas, la pagina queda mas legible y el siguiente corte natural dentro de `repairs` pasa a `AdminRepairCreatePage.tsx`. No hay cambios deliberados en rutas, payloads ni comportamiento funcional esperado.
- Alternativas consideradas: seguir agregando helpers privados dentro del mismo archivo o saltar primero a `AdminRepairCreatePage.tsx`; descartado porque el detalle admin ya podia apoyarse en el split previo de pricing y ofrecia el mejor retorno inmediato dentro del mismo subdominio.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/repairs/{AdminRepairDetailPage.tsx,admin-repair-detail.helpers.ts,admin-repair-detail.helpers.test.ts,admin-repair-detail.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0058]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminRepairCreatePage` pasa de pagina hotspot a orquestador con helpers y sections
- Contexto: despues de ordenar `RepairProviderPartPricingSection` y `AdminRepairDetailPage`, el siguiente hotspot claro del frontend en `repairs` quedo en `AdminRepairCreatePage.tsx`. La pagina mezclaba carga del catalogo tecnico, defaults de marca/modelo/falla, validaciones, recalculo de sugerencia, armado del payload, formulario completo y cierre visual en un solo archivo de mas de 680 lineas.
- Decision: mantener la ruta y el flujo del alta admin estables, pero mover normalizacion/validaciones/armado del payload a `admin-repair-create.helpers.ts`, mover la UI seccionada a `admin-repair-create.sections.tsx` y dejar `AdminRepairCreatePage.tsx` como orquestador de catalogo, pricing y submit. Tambien se agrega test unitario para helpers del alta.
- Impacto: `AdminRepairCreatePage.tsx` baja a unas 440 lineas, el flujo create queda alineado con el detalle admin y el subdominio `repairs` ya tiene un patron consistente entre create/detail/pricing. No hay cambios deliberados en rutas, payloads ni comportamiento funcional esperado.
- Alternativas consideradas: seguir agregando helpers privados dentro del mismo archivo o saltar primero a otro hotspot del frontend como `AppShell.tsx`; descartado porque cerrar primero `repairs` deja el modulo mas consistente y reduce deuda donde todavia habia mas mezcla de estado y formulario.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/repairs/{AdminRepairCreatePage.tsx,admin-repair-create.helpers.ts,admin-repair-create.helpers.test.ts,admin-repair-create.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0059]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AppShell` pasa de layout monolitico a shell orquestador con subcomponentes en `layouts/app-shell`
- Contexto: despues de ordenar los hotspots fuertes de `repairs`, el siguiente punto transversal mas grande del frontend quedo en `AppShell.tsx`. El archivo mezclaba sync de auth, branding, navbar, sidebar mobile, menu de cuenta, footer, focus management y comportamiento responsive en un solo layout de mas de 500 lineas.
- Decision: mantener el wiring funcional del shell y sus rutas estables, pero mover la UI del menu de cuenta, sidebar mobile y footer a `layouts/app-shell/account-menu.tsx`, `layouts/app-shell/mobile-sidebar.tsx` y `layouts/app-shell/footer.tsx`, con iconos/fallbacks concentrados en `layouts/app-shell/link-icons.tsx`. `AppShell.tsx` queda como orquestador de estado, listeners, branding y accesos.
- Impacto: `AppShell.tsx` baja a unas 370 lineas, el shell queda mas facil de leer y el proximo corte natural del frontend se desplaza a hotspots de pagina como `AdminProductEditPage.tsx` o `AdminProvidersPage.tsx`. No hay cambios deliberados en rutas, guards ni comportamiento visible esperado.
- Alternativas consideradas: seguir agregando helpers privados dentro del mismo archivo o saltar primero a otra pagina grande del admin; descartado porque el shell es un punto transversal y concentraba demasiada UI compartida para seguir creciendo en un unico archivo.
- Archivos / modulos afectados: `next-stack/apps/web/src/layouts/{AppShell.tsx,app-shell/account-menu.tsx,app-shell/footer.tsx,app-shell/link-icons.tsx,app-shell/mobile-sidebar.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0060]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminProductEditPage` pasa a orquestador y el formulario comercial de productos gana base compartida
- Contexto: despues de bajar `AppShell`, el siguiente hotspot claro del frontend quedo en `AdminProductEditPage.tsx`. La pagina mezclaba carga de producto, pricing recomendado, imagen, resumen, formulario completo y helpers repetidos que ya existian en el alta de productos.
- Decision: mantener la ruta y el flujo de edicion estables, pero mover el render principal a `admin-product-edit.sections.tsx`, extraer helpers puros de catalogo comercial a `admin-product-form.helpers.ts` y centralizar controles repetidos en `admin-product-form.controls.tsx`. `AdminProductEditPage.tsx` queda como orquestador de estado, carga, upload y submit; `AdminProductCreatePage.tsx` reutiliza la base compartida.
- Impacto: `AdminProductEditPage.tsx` baja a menos de 300 lineas, el modulo `catalogAdmin` reduce duplicacion entre create/edit y el siguiente hotspot del frontend se mueve hacia `AdminProvidersPage.tsx`, `AdminOrdersPage.tsx` o `styles.css`. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo la pagina de edicion sin tocar piezas compartidas o dejar helpers duplicados entre create/edit; descartado porque seguia duplicando slug, margen, opciones y controles basicos de formulario.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/catalogAdmin/{AdminProductEditPage.tsx,AdminProductCreatePage.tsx,admin-product-edit.sections.tsx,admin-product-form.helpers.ts,admin-product-form.helpers.test.ts,admin-product-form.controls.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0061]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminProvidersPage` pasa a orquestador y el feature `providers` gana helpers + sections propios
- Contexto: despues de ordenar `catalogAdmin`, el siguiente hotspot visible del frontend quedo en `AdminProvidersPage.tsx`. La pagina mezclaba resumen operativo, prioridad manual, query de prueba, alta de proveedor, tabla editable y acciones de probe/toggle/update en un solo archivo de mas de 500 lineas.
- Decision: mantener la ruta y el wiring con `adminApi` estables, pero mover la UI pesada a `admin-providers.sections.tsx` y concentrar calculos/estado derivado del feature en `admin-providers.helpers.ts`, con cobertura unitaria en `admin-providers.helpers.test.ts`. `AdminProvidersPage.tsx` queda como orquestador de fetch, patches, reorder, probe y mensajes.
- Impacto: `AdminProvidersPage.tsx` baja a menos de 200 lineas, el subdominio `providers` queda mejor seccionado y el siguiente hotspot fuerte del frontend se mueve hacia `AdminOrdersPage.tsx` o `styles.css`. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo la tabla editable o crear una capa API nueva exclusiva de `providers`; descartado porque el mayor retorno inmediato estaba en separar toda la UI operativa sin abrir una frontera nueva sobre `adminApi`.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/providers/{AdminProvidersPage.tsx,admin-providers.helpers.ts,admin-providers.helpers.test.ts,admin-providers.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0062]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminOrdersPage` pasa a orquestador y el feature `orders` gana helpers + sections propios
- Contexto: despues de ordenar `providers`, el siguiente hotspot visible del frontend quedo en `AdminOrdersPage.tsx`. La pagina mezclaba metricas, filtros, contadores de WhatsApp, listado, detalle inline, enlaces de impresion, formato temporal y cambio de estado en un solo archivo de mas de 500 lineas.
- Decision: mantener la ruta y el wiring con `ordersApi` estables, pero mover el estado derivado del feature a `admin-orders.helpers.ts`, mover la UI pesada a `admin-orders.sections.tsx` y dejar `AdminOrdersPage.tsx` como orquestador de fetch, detalle seleccionado y patches de estado. Tambien se agrega test unitario para helpers del tracking admin.
- Impacto: `AdminOrdersPage.tsx` baja a menos de 200 lineas, el subdominio `orders` gana una frontera mas clara entre datos, metricas y render, y el siguiente hotspot natural dentro del mismo modulo pasa a `AdminQuickSalesPage.tsx`. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo el panel de detalle inline o mover primero `AdminQuickSalesPage.tsx`; descartado porque `AdminOrdersPage.tsx` era el hotspot mas transversal del feature y ordenar primero el tracking admin deja un patron mas reutilizable para el resto del modulo.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/orders/{AdminOrdersPage.tsx,admin-orders.helpers.ts,admin-orders.helpers.test.ts,admin-orders.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0063]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminQuickSalesPage` pasa a orquestador y la venta rapida gana helpers + sections propios
- Contexto: despues de ordenar `AdminOrdersPage`, el siguiente hotspot claro del frontend dentro de `orders` quedo en `AdminQuickSalesPage.tsx`. La pagina mezclaba scanner, busqueda manual, mutaciones del carrito, validaciones de telefono, totales, ticket actual y confirmacion de la venta en un solo archivo de casi 500 lineas.
- Decision: mantener la ruta y el wiring con `catalogAdminApi` y `ordersApi` estables, pero mover validaciones, mutaciones puras del carrito y totales a `admin-quick-sales.helpers.ts`, mover la UI de scanner, busqueda y ticket a `admin-quick-sales.sections.tsx` y dejar `AdminQuickSalesPage.tsx` como orquestador de estado, fetch y confirmacion. Tambien se agrega test unitario para helpers de venta rapida.
- Impacto: `AdminQuickSalesPage.tsx` baja de forma marcada, el subdominio `orders` queda mas consistente entre tracking admin y venta rapida, y el siguiente hotspot natural dentro del frontend se desplaza a `styles.css` o a paginas grandes de `admin`/`pricing`. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo el scanner o mover primero `styles.css`; descartado porque cerrar antes el segundo hotspot fuerte de `orders` deja el modulo operativo mas coherente y reduce mejor el riesgo local que abrir ya un cleanup visual transversal.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/orders/{AdminQuickSalesPage.tsx,admin-quick-sales.helpers.ts,admin-quick-sales.helpers.test.ts,admin-quick-sales.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0064]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `styles.css` pasa de hotspot monolitico a entrypoint con capas fisicas en `src/styles`
- Contexto: despues de bajar los hotspots mas grandes de `orders`, el siguiente punto de complejidad transversal del frontend seguia en `next-stack/apps/web/src/styles.css`, un archivo de mas de 3600 lineas que mezclaba base, store, shell/layout, repairs, componentes UI, admin y commerce en una sola cascada.
- Decision: mantener `main.tsx` y el wiring del build estables, pero convertir `styles.css` en un entrypoint delgado que solo importa capas fisicas y mover las reglas existentes a `src/styles/base.css`, `src/styles/store.css`, `src/styles/layout.css`, `src/styles/repairs.css`, `src/styles/components.css`, `src/styles/admin.css` y `src/styles/commerce.css`, respetando el orden original de cascada.
- Impacto: el repo gana una frontera visual mucho mas clara sin cambiar clases, rutas ni comportamiento deliberado; la lectura del frontend deja de depender de un solo archivo gigante y los siguientes cambios de UI pasan a tener un area de impacto mas localizada.
- Alternativas consideradas: seguir partiendo paginas individuales primero o reordenar estilos por componentes a mano; descartado porque el mayor hotspot restante era ya transversal y un reordenamiento semantico manual aumentaba el riesgo de romper la cascada respecto de un split fisico conservador por rangos reales.
- Archivos / modulos afectados: `next-stack/apps/web/src/styles.css`, `next-stack/apps/web/src/styles/*`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0065]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminProductPricingRulesPage` pasa a orquestador y el pricing comercial gana helpers + sections propios
- Contexto: despues de partir `styles.css`, el siguiente hotspot visible del frontend quedo en `AdminProductPricingRulesPage.tsx`. La pagina mezclaba preferencias globales, simulador, alta de reglas, edicion inline, filtros por categoria/producto y render completo del feature en un solo archivo de mas de 500 lineas.
- Decision: mantener la ruta y el wiring con `productPricingApi` estables, pero mover mapping, filtros de alcance, armado de payloads y texto del simulador a `admin-product-pricing-rules.helpers.ts`, mover la UI pesada a `admin-product-pricing-rules.sections.tsx` y dejar `AdminProductPricingRulesPage.tsx` como orquestador de fetch, simulacion y mutaciones de reglas. Tambien se agrega test unitario para helpers del feature.
- Impacto: `AdminProductPricingRulesPage.tsx` baja a menos de 300 lineas, el pricing comercial gana una frontera mas clara entre datos, simulacion y render, y el siguiente hotspot natural dentro del mismo subdominio pasa a `AdminRepairPricingRulesPage.tsx`. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo la tarjeta editable de reglas o saltar primero a `AdminRepairPricingRulesPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en el hotspot mas grande del area de pricing comercial y permitia fijar antes el patron de helpers + sections.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/{AdminProductPricingRulesPage.tsx,admin-product-pricing-rules.helpers.ts,admin-product-pricing-rules.helpers.test.ts,admin-product-pricing-rules.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0066]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminRepairPricingRulesPage` pasa a orquestador y el pricing de reparaciones gana helpers + sections propios
- Contexto: despues de ordenar el pricing comercial, el siguiente hotspot claro del area `admin/pricing` quedo en `AdminRepairPricingRulesPage.tsx`. La pagina mezclaba carga de reglas, lookups del catalogo tecnico, dependencia entre tipo/marca/grupo/modelo/falla, armado del patch y render completo de la grilla editable en un solo archivo de mas de 400 lineas.
- Decision: mantener la ruta y el wiring con `repairsApi`, `adminApi` y `deviceCatalogApi` estables, pero mover mapping, scope dependiente, filtros y armado del payload a `admin-repair-pricing-rules.helpers.ts`, mover la grilla editable a `admin-repair-pricing-rules.sections.tsx` y dejar `AdminRepairPricingRulesPage.tsx` como orquestador de fetch, lookups y mutaciones. Tambien se agrega test unitario para helpers del feature.
- Impacto: `AdminRepairPricingRulesPage.tsx` baja a unas 150 lineas, el pricing de reparaciones gana una frontera mas clara entre datos, scope y render, y el subdominio `admin/pricing` queda mucho mas consistente entre la version comercial y la de reparaciones. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo la celda de scope o saltar primero a `AdminRepairPricingRuleEditPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en la pagina lista/editable principal y permitia fijar antes el mismo patron que en el pricing comercial.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/{AdminRepairPricingRulesPage.tsx,admin-repair-pricing-rules.helpers.ts,admin-repair-pricing-rules.helpers.test.ts,admin-repair-pricing-rules.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0067]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminDashboardPage` pasa a orquestador y el dashboard admin gana helpers + sections propios
- Contexto: despues de cerrar el frente `admin/pricing`, el siguiente hotspot real del frontend quedo en `AdminDashboardPage.tsx`. La pagina mezclaba fetch, resumen operativo, bandeja de trabajo, accesos principales, actividad reciente, metricas y modulos avanzados en un solo archivo de mas de 450 lineas.
- Decision: mantener la ruta y el wiring con `adminApi.dashboard()` estables, pero mover calculos puros del panel a `admin-dashboard.helpers.ts`, mover las secciones visuales a `admin-dashboard.sections.tsx` y dejar `AdminDashboardPage.tsx` como orquestador de carga, error, summary y render de alto nivel. Tambien se agrega test unitario para los helpers del dashboard.
- Impacto: `AdminDashboardPage.tsx` baja a unas 80 lineas, el dashboard queda mucho mas legible y el subdominio `admin` gana una frontera clara entre fetch, metricas operativas y UI. No hay cambios deliberados en rutas ni comportamiento visible esperado.
- Alternativas consideradas: partir solo las cards visuales o mover primero `StorePage.tsx`; descartado porque el mayor retorno inmediato seguia estando en el panel admin mas transversal y permitia aislar primero la logica operativa reutilizable del dashboard.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/{AdminDashboardPage.tsx,admin-dashboard.helpers.ts,admin-dashboard.helpers.test.ts,admin-dashboard.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0068]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `StorePage` pasa a orquestador y la tienda publica gana helpers + sections propios
- Contexto: despues de bajar los hotspots mas grandes de `admin`, `orders`, `repairs` y `catalogAdmin`, el siguiente `.tsx` visible con mezcla innecesaria quedo en `StorePage.tsx`. La pagina concentraba fetch de hero/categorias/productos, sync de query params, calculos visuales del hero, toolbar, sort mobile, rail de categorias, empty state y card grid en un solo archivo de mas de 440 lineas.
- Decision: mantener la ruta `/store`, el wiring con `storeApi` y el comportamiento de filtros estables, pero mover query helpers, visual vars del hero y labels derivadas a `store-page.helpers.ts`, mover toolbar, sheet mobile, rail de categorias, resultados y cards a `store-page.sections.tsx`, y dejar `StorePage.tsx` como orquestador de fetch, sincronizacion y composicion. Tambien se agrega test unitario para los helpers del feature.
- Impacto: `StorePage.tsx` baja de forma marcada, la tienda publica gana una frontera clara entre datos, derivaciones y UI, y el siguiente hotspot del frontend se desplaza a paginas grandes de `catalogAdmin` o `admin` como `AdminCategoriesPage.tsx` y `AdminProductsPage.tsx`. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo la card de producto o saltar primero a `AdminCategoriesPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en la pagina publica mas cargada y permitia cerrar tambien el frente visible del storefront con la misma metodologia ya usada en admin.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/store/{StorePage.tsx,store-page.helpers.ts,store-page.helpers.test.ts,store-page.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0069]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminCategoriesPage` pasa a orquestador y el CRUD de categorias gana helpers + sections propios
- Contexto: despues de ordenar `StorePage`, el siguiente hotspot claro del subdominio `catalogAdmin` quedo en `AdminCategoriesPage.tsx`. La pagina mezclaba slugify, stats, filtro local, deteccion de cambios, listado, alertas y formulario create/edit en un solo archivo de mas de 400 lineas.
- Decision: mantener las rutas `/admin/categorias`, `/admin/categorias/crear` y `/admin/categorias/:id/editar` estables, pero mover slugify, stats, filtro y diff del draft a `admin-categories.helpers.ts`, mover alertas, rail operativo, listado y formulario a `admin-categories.sections.tsx`, y dejar `AdminCategoriesPage.tsx` como orquestador de fetch, sync de ruta y mutaciones del CRUD. Tambien se agrega test unitario para helpers del feature.
- Impacto: `AdminCategoriesPage.tsx` baja de forma marcada, `catalogAdmin` gana un patron consistente entre categorias y productos, y el siguiente hotspot natural del subdominio pasa a `AdminProductsPage.tsx`. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo el formulario o saltar primero a `AdminProductsPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en el CRUD base del catalogo y ordenarlo primero deja mejor preparado el resto del subdominio.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/catalogAdmin/{AdminCategoriesPage.tsx,admin-categories.helpers.ts,admin-categories.helpers.test.ts,admin-categories.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0070]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminProductsPage` pasa a orquestador y el catalogo operativo gana helpers + sections propios
- Contexto: despues de ordenar `AdminCategoriesPage`, el siguiente hotspot claro de `catalogAdmin` quedo en `AdminProductsPage.tsx`. La pagina mezclaba stats, filtros server/client, opciones de selects, resumen de precio/margen, listado de productos y patches rapidos en un solo archivo de mas de 500 lineas.
- Decision: mantener la ruta `/admin/productos`, el wiring con `catalogAdminApi` y el comportamiento actual de filtros estables, pero mover stats, opciones, filtros client-side y resumen de precio/margen a `admin-products.helpers.ts`, mover toolbar, cards de stats y listado operativo a `admin-products.sections.tsx`, y dejar `AdminProductsPage.tsx` como orquestador de fetch, sync de filtros y mutaciones rapidas. Tambien se agrega test unitario para helpers del feature.
- Impacto: `AdminProductsPage.tsx` baja de forma marcada, `catalogAdmin` queda mucho mas consistente entre categorias, productos y formularios comerciales, y el siguiente hotspot natural del frontend pasa a pantallas admin mas especificas como `AdminStoreHeroSettingsPage.tsx` o `AdminAutoReportsPage.tsx`. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo el listado de productos o saltar primero a otra pagina del admin; descartado porque cerrar primero el hotspot principal del catalogo comercial deja mas coherente el subdominio antes de abrir otros frentes.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/catalogAdmin/{AdminProductsPage.tsx,admin-products.helpers.ts,admin-products.helpers.test.ts,admin-products.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano
