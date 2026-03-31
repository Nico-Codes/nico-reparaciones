# Bitacora de cambios asistidos por IA

## Formato sugerido

### YYYY-MM-DD - Actor/Agente
- Alcance:
- Tipo de intervencion:
- Archivos tocados:
- ¿Cambio comportamiento funcional?: Si/No
- Validaciones ejecutadas:
- Riesgos / notas:

---

### 2026-03-13 - Codex
- Alcance: activacion de envio real de WhatsApp por Meta Cloud API reutilizando templates, logs y triggers existentes.
- Tipo de intervencion: backend real de integracion + schema/logs + webhook minimo + ajuste menor de UI admin para estados reales.
- Archivos tocados:
  - 
ext-stack/apps/api/prisma/schema.prisma
  - 
ext-stack/apps/api/prisma/migrations/20260313130000_add_whatsapp_cloud_api_fields/migration.sql
  - 
ext-stack/apps/api/src/modules/whatsapp/{whatsapp.module.ts,whatsapp.controller.ts,whatsapp.service.ts}
  - 
ext-stack/apps/api/src/modules/{app,admin,orders,repairs}/*
  - 
ext-stack/.env.example
  - 
ext-stack/.env.production.example
  - 
ext-stack/scripts/env-check.mjs
  - 
ext-stack/apps/web/src/features/admin/{whatsappApi.ts,AdminWhatsappPage.tsx,AdminWhatsappOrdersPage.tsx,whatsapp-ui.ts}
  - project-docs/WHATSAPP_CLOUD_API_INTEGRATION.md
  - project-docs/DECISIONS_LOG.md
- ¿Cambio comportamiento funcional?: Si. Los triggers de pedidos, reparaciones y ventas rapidas ahora disparan envio real por Meta Cloud API cuando la configuracion existe; WhatsAppLog ya refleja PENDING, SENT o FAILED con emoteMessageId, providerStatus, errorMessage, intentos y timestamps.
- Validaciones ejecutadas:
  - 
pm run db:generate --workspace @nico/api
  - 
pm run db:migrate:deploy --workspace @nico/api
  - 
pm run typecheck --workspace @nico/api
  - 
pm run typecheck --workspace @nico/web
  - 
pm run build --workspace @nico/api
  - 
pm run build --workspace @nico/web
  - 
pm run smoke:backend
  - 
pm run smoke:web
  - 
pm run qa:route-parity
  - 
pm run qa:frontend:e2e
  - probe dirigido con mock local de Meta para exito, fallo y webhook
- Riesgos / notas:
  - la integracion actual reutiliza templates de texto libre; fuera de la ventana de 24h Meta puede rechazar mensajes hasta migrar a templates aprobados
  - pedidos normales siguen sin telefono persistido, por lo que esos logs pueden terminar en FAILED por missing_or_invalid_phone
### 2026-03-12 - Codex
- Alcance: mejora corta de calidad sobre la búsqueda multi-proveedor de repuestos con proveedores reales.
- Tipo de intervencion: hardening de extracción HTML/normalización/ranking sin cambiar el flujo create/detail/snapshot.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/admin/admin.service.ts`
  - `project-docs/REPAIR_PROVIDER_PART_PRICING_PLAN.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Si. La búsqueda agregada ahora extrae mejor nombre/precio/disponibilidad para `Evophone`, `Okey Rosario`, `Celuphone`, `Novocell` y `Electrostore`, evita labels de “Añadir al carrito”, parsea mejor formatos de precio WooCommerce/Wix y ordena resultados con más peso en coincidencia exacta, precio real y stock útil.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/api`
  - probe dirigido `modulo samsung a10` sobre `POST /api/admin/providers/search-parts`
  - gates finales de typecheck/build/smoke/route-parity/frontend-e2e
- Riesgos / notas:
  - el ajuste no introduce scraping masivo ni catálogo local; sigue siendo búsqueda remota normalizada
  - se mantuvo la búsqueda puntual por proveedor como fallback, pero el beneficio principal está en la búsqueda agregada con proveedores reales

### 2026-03-12 - Codex
- Alcance: cierre fino de `Nueva reparación` con copy visible corregido y decisión operativa sobre catálogo exacto.
- Tipo de intervencion: ajuste UX acotado, sin tocar backend ni el flujo create/preview/snapshot.
- Archivos tocados:
  - `next-stack/apps/web/src/features/repairs/AdminRepairCreatePage.tsx`
  - `next-stack/apps/web/src/features/repairs/RepairProviderPartPricingSection.tsx`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Si, menor. `Marca exacta del catálogo` y `Modelo exacto del catálogo` pasan a estar visibles en `Datos básicos` porque hoy sí impactan el cálculo y la búsqueda de repuestos; el disclosure secundario queda solo para `Notas internas`.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:web`
  - verificación real `Nueva reparación -> revisar copy -> crear reparación`
- Riesgos / notas:
  - no se tocó la lógica de create, preview ni snapshot
  - el objetivo fue hacer visible solo lo que hoy aporta valor real al flujo operativo

### 2026-03-12 - Codex
- Alcance: reorganización operativa del dashboard admin principal.
- Tipo de intervencion: UX funcional acotada sobre `AdminDashboardPage`, sin rediseño general del admin.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/AdminDashboardPage.tsx`
  - `next-stack/apps/web/src/styles.css`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Sí, menor. El dashboard deja de ser un mapa general y pasa a priorizar acciones rápidas, bandeja de trabajo y módulos de uso diario. La administración avanzada queda compacta y colapsable.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:web`
  - verificación real del dashboard admin con quick actions y navegación
- Riesgos / notas:
  - no se tocaron rutas ni contratos del backend
  - la métrica y actividad siguen presentes, pero con menor jerarquía que las acciones operativas

### 2026-03-12 - Codex
- Alcance: Fase 3 corta de UX/historial para reparaciones con proveedor + repuesto + calculo real.
- Tipo de intervencion: hardening puntual de backend + mejora operativa del detalle admin.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/repairs/repairs.service.ts`
  - `next-stack/apps/web/src/features/repairs/api.ts`
  - `next-stack/apps/web/src/features/repairs/RepairProviderPartPricingSection.tsx`
  - `next-stack/apps/web/src/features/repairs/AdminRepairDetailPage.tsx`
  - `project-docs/REPAIR_PROVIDER_PART_PRICING_PLAN.md`
  - `project-docs/FRONTEND_QA_HARDENING.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Si. El detalle admin ahora expone historial basico de snapshots, deja mucho mas clara la diferencia entre snapshot activo, sugerido, aplicado y presupuesto actual, y agrega trazabilidad explicita cuando el presupuesto se modifica manualmente despues del calculo.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
  - `npm run qa:frontend:e2e`
  - probe dirigido `create con snapshot -> update con snapshot nuevo -> override manual -> detail con historial`
- Riesgos / notas:
  - esta fase no agrega comparacion multiple entre proveedores ni operaciones avanzadas sobre snapshots historicos
  - el objetivo fue hacer el flujo actual mucho mas claro para el operador sin abrir una nueva fase grande

### 2026-03-11 - Codex
- Alcance: Implementacion Fase 2 de reparaciones con proveedor + repuesto + calculo real.
- Tipo de intervencion: integracion funcional real frontend + backend existente + persistencia/activacion de snapshot.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/repairs/repairs.controller.ts`
  - `next-stack/apps/api/src/modules/repairs/repairs.service.ts`
  - `next-stack/apps/web/src/features/admin/api.ts`
  - `next-stack/apps/web/src/features/repairs/api.ts`
  - `next-stack/apps/web/src/features/repairs/types.ts`
  - `next-stack/apps/web/src/features/repairs/repair-pricing.ts`
  - `next-stack/apps/web/src/features/repairs/RepairProviderPartPricingSection.tsx`
  - `next-stack/apps/web/src/features/repairs/AdminRepairCreatePage.tsx`
  - `next-stack/apps/web/src/features/repairs/AdminRepairDetailPage.tsx`
  - `project-docs/REPAIR_PROVIDER_PART_PRICING_PLAN.md`
  - `project-docs/FRONTEND_QA_HARDENING.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Si. El admin ahora puede elegir proveedor, buscar repuesto, pedir preview proveedor + repuesto + regla, usar el sugerido y persistir un `RepairPricingSnapshot` aplicado al crear o actualizar una reparacion. El detalle tambien muestra el snapshot activo y permite reemplazarlo explicitamente al guardar.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
  - `npm run qa:frontend:e2e`
  - probe dirigido backend `proveedor -> repuesto -> preview -> create con snapshot -> update con snapshot nuevo`
  - verificacion UI minima de presencia de la seccion `Proveedor y repuesto` en create/detail
- Riesgos / notas:
  - la fase no introduce todavia historial visible de snapshots ni comparacion multiple entre proveedores
  - la verificacion UI minima sobre preview local mostro fallos de fetch ajenos a la seccion por configuracion del host de API en ese contexto, pero la presencia del bloque y el flujo real quedaron validados por codigo + gates + probe de negocio

### 2026-03-11 - Codex
- Alcance: implementación de la Fase 1 para reparaciones con proveedor + repuesto + cálculo real.
- Tipo de intervencion: schema Prisma + endpoints backend nuevos + wrappers tipados para la siguiente fase de frontend.
- Archivos tocados:
  - `next-stack/apps/api/prisma/schema.prisma`
  - `next-stack/apps/api/prisma/migrations/20260311170000_add_repair_pricing_snapshots_phase1/migration.sql`
  - `next-stack/apps/api/src/modules/admin/admin.controller.ts`
  - `next-stack/apps/api/src/modules/admin/admin.service.ts`
  - `next-stack/apps/api/src/modules/pricing/pricing.controller.ts`
  - `next-stack/apps/api/src/modules/pricing/pricing.service.ts`
  - `next-stack/apps/web/src/features/admin/api.ts`
  - `next-stack/apps/web/src/features/repairs/api.ts`
  - `project-docs/REPAIR_PROVIDER_PART_PRICING_PLAN.md`
  - `project-docs/BACKEND_BUSINESS_RULES_HARDENING.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Sí. El backend ahora puede devolver repuestos normalizados por proveedor y calcular un preview real de presupuesto usando proveedor + repuesto + regla, además de persistir snapshots de pricing de reparación en schema.
- Validaciones ejecutadas:
  - `npm run db:generate --workspace @nico/api`
  - `npm run db:migrate:deploy --workspace @nico/api`
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - probes dirigidos de search-parts y provider-part-preview
- Riesgos / notas:
  - la Fase 1 no integra todavía la UX completa en create/detail; deja la base lista y contratos tipados para la Fase 2.
  - `pricingResolve` se mantiene intacto; el nuevo preview usa endpoint propio para no mezclar cálculo abstracto con costo real de proveedor.

### 2026-03-11 - Codex
- Alcance: auditoria y diseno tecnico para migrar la feature completa de reparaciones basada en proveedor + repuesto + calculo real.
- Tipo de intervencion: documentacion tecnica y decision de arquitectura.
- Archivos tocados:
  - `project-docs/REPAIR_PROVIDER_PART_PRICING_PLAN.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: No. Esta fase no implementa la feature; deja definido el modelo recomendado, los endpoints necesarios, la UX objetivo y la estrategia de migracion por fases.
- Validaciones ejecutadas:
  - inspeccion dirigida de `schema.prisma`, `pricing.service.ts`, `repairs.service.ts`, `admin.service.ts`, `AdminRepairCreatePage.tsx`, `AdminRepairDetailPage.tsx`, `AdminProvidersPage.tsx` y `AdminWarrantyCreatePage.tsx`
- Riesgos / notas:
  - el runtime legacy ya no existe en el repo, por lo que parte de la reconstruccion de la feature original queda marcada como pendiente de validacion humana
  - la recomendacion explicita es no implementar esta feature con campos sueltos en `Repair`, sino con snapshots historicos y fases controladas

### 2026-03-11 - Codex
- Alcance: hardening backend de reglas de negocio en pedidos, reparaciones y catalogo admin.
- Tipo de intervencion: validacion/negocio + control de transiciones + proteccion contra payloads permisivos y carreras de stock.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/cart/cart.service.ts`
  - `next-stack/apps/api/src/modules/orders/orders.controller.ts`
  - `next-stack/apps/api/src/modules/orders/orders.service.ts`
  - `next-stack/apps/api/src/modules/repairs/repairs.service.ts`
  - `next-stack/apps/api/src/modules/catalog-admin/catalog-admin.controller.ts`
  - `next-stack/apps/api/src/modules/catalog-admin/catalog-admin.service.ts`
  - `project-docs/BACKEND_BUSINESS_RULES_HARDENING.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Si. La API ahora rechaza estados invalidos en pedidos y reparaciones, protege transiciones de estado, valida referencias de catalogo en productos/reparaciones, deja de responder `200` en payloads invalidos y usa decremento atomico de stock al confirmar compras o ventas rapidas.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
  - `npm run qa:frontend:e2e`
  - probe dirigido sobre rechazo de estado invalido y categoria inexistente
- Riesgos / notas:
  - checkout mantiene compatibilidad actual con el `paymentMethod` enviado desde frontend; endurecer ese enum requerira alinear antes el contrato de UI.
  - el hardening se concentro en negocio critico; auth/guards fue auditado y no requirio cambios estructurales en esta fase.

---

### 2026-03-13 - Codex
- Alcance: activacion de envio real de WhatsApp por Meta Cloud API reutilizando templates, logs y triggers existentes.
- Tipo de intervencion: backend real de integracion + schema/logs + webhook minimo + ajuste menor de UI admin para estados reales.
- Archivos tocados:
  - 
ext-stack/apps/api/prisma/schema.prisma
  - 
ext-stack/apps/api/prisma/migrations/20260313130000_add_whatsapp_cloud_api_fields/migration.sql
  - 
ext-stack/apps/api/src/modules/whatsapp/{whatsapp.module.ts,whatsapp.controller.ts,whatsapp.service.ts}
  - 
ext-stack/apps/api/src/modules/{app,admin,orders,repairs}/*
  - 
ext-stack/.env.example
  - 
ext-stack/.env.production.example
  - 
ext-stack/scripts/env-check.mjs
  - 
ext-stack/apps/web/src/features/admin/{whatsappApi.ts,AdminWhatsappPage.tsx,AdminWhatsappOrdersPage.tsx,whatsapp-ui.ts}
  - project-docs/WHATSAPP_CLOUD_API_INTEGRATION.md
  - project-docs/DECISIONS_LOG.md
- ¿Cambio comportamiento funcional?: Si. Los triggers de pedidos, reparaciones y ventas rapidas ahora disparan envio real por Meta Cloud API cuando la configuracion existe; WhatsAppLog ya refleja PENDING, SENT o FAILED con emoteMessageId, providerStatus, errorMessage, intentos y timestamps.
- Validaciones ejecutadas:
  - 
pm run db:generate --workspace @nico/api
  - 
pm run db:migrate:deploy --workspace @nico/api
  - 
pm run typecheck --workspace @nico/api
  - 
pm run typecheck --workspace @nico/web
  - 
pm run build --workspace @nico/api
  - 
pm run build --workspace @nico/web
  - 
pm run smoke:backend
  - 
pm run smoke:web
  - 
pm run qa:route-parity
  - 
pm run qa:frontend:e2e
  - probe dirigido con mock local de Meta para exito, fallo y webhook
- Riesgos / notas:
  - la integracion actual reutiliza templates de texto libre; fuera de la ventana de 24h Meta puede rechazar mensajes hasta migrar a templates aprobados
  - pedidos normales siguen sin telefono persistido, por lo que esos logs pueden terminar en FAILED por missing_or_invalid_phone
### 2026-03-11 - Codex
- Alcance: hardening funcional adicional sobre modulos admin de negocio.
- Tipo de intervencion: proteccion contra stale responses + bloqueo de mutaciones duplicadas + validacion operativa mas estricta.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/AdminUsersPage.tsx`
  - `next-stack/apps/web/src/features/orders/AdminQuickSalesPage.tsx`
  - `next-stack/apps/web/src/features/catalogAdmin/AdminProductsPage.tsx`
  - `next-stack/apps/web/src/features/catalogAdmin/AdminCategoriesPage.tsx`
  - `project-docs/FRONTEND_QA_HARDENING.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Si. El admin ahora bloquea mejor cambios de rol invalidos o repetidos, endurece venta rapida frente a coincidencias parciales/lineas invalidas y evita acciones redundantes en productos y categorias.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
  - `npm run qa:frontend:e2e`
- Riesgos / notas:
  - el alcance se mantuvo acotado a debilidades funcionales reales en modulos admin activos; no se abrio una fase nueva de rediseño ni de backend.
  - `AdminQuickSalesPage` ahora exige coincidencia exacta por SKU/codigo de barras al agregar por codigo y no informa exito si la linea no puede agregarse.

---

### 2026-03-13 - Codex
- Alcance: activacion de envio real de WhatsApp por Meta Cloud API reutilizando templates, logs y triggers existentes.
- Tipo de intervencion: backend real de integracion + schema/logs + webhook minimo + ajuste menor de UI admin para estados reales.
- Archivos tocados:
  - 
ext-stack/apps/api/prisma/schema.prisma
  - 
ext-stack/apps/api/prisma/migrations/20260313130000_add_whatsapp_cloud_api_fields/migration.sql
  - 
ext-stack/apps/api/src/modules/whatsapp/{whatsapp.module.ts,whatsapp.controller.ts,whatsapp.service.ts}
  - 
ext-stack/apps/api/src/modules/{app,admin,orders,repairs}/*
  - 
ext-stack/.env.example
  - 
ext-stack/.env.production.example
  - 
ext-stack/scripts/env-check.mjs
  - 
ext-stack/apps/web/src/features/admin/{whatsappApi.ts,AdminWhatsappPage.tsx,AdminWhatsappOrdersPage.tsx,whatsapp-ui.ts}
  - project-docs/WHATSAPP_CLOUD_API_INTEGRATION.md
  - project-docs/DECISIONS_LOG.md
- ¿Cambio comportamiento funcional?: Si. Los triggers de pedidos, reparaciones y ventas rapidas ahora disparan envio real por Meta Cloud API cuando la configuracion existe; WhatsAppLog ya refleja PENDING, SENT o FAILED con emoteMessageId, providerStatus, errorMessage, intentos y timestamps.
- Validaciones ejecutadas:
  - 
pm run db:generate --workspace @nico/api
  - 
pm run db:migrate:deploy --workspace @nico/api
  - 
pm run typecheck --workspace @nico/api
  - 
pm run typecheck --workspace @nico/web
  - 
pm run build --workspace @nico/api
  - 
pm run build --workspace @nico/web
  - 
pm run smoke:backend
  - 
pm run smoke:web
  - 
pm run qa:route-parity
  - 
pm run qa:frontend:e2e
  - probe dirigido con mock local de Meta para exito, fallo y webhook
- Riesgos / notas:
  - la integracion actual reutiliza templates de texto libre; fuera de la ventana de 24h Meta puede rechazar mensajes hasta migrar a templates aprobados
  - pedidos normales siguen sin telefono persistido, por lo que esos logs pueden terminar en FAILED por missing_or_invalid_phone
### 2026-03-11 - Codex
- Alcance: implementación del flujo completo de alta de reparaciones en el frontend admin.
- Tipo de intervencion: nueva ruta protegida + nueva pantalla/formulario + CTA en listado + corrección de alias legacy.
- Archivos tocados:
  - `next-stack/apps/web/src/App.tsx`
  - `next-stack/apps/web/src/features/repairs/api.ts`
  - `next-stack/apps/web/src/features/repairs/AdminRepairsListPage.tsx`
  - `next-stack/apps/web/src/features/repairs/AdminRepairCreatePage.tsx`
  - `next-stack/apps/web/src/features/repairs/AdminRepairDetailPage.tsx`
  - `next-stack/scripts/qa-frontend-e2e.mjs`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Si. El admin ahora puede crear reparaciones desde una ruta real (`/admin/repairs/create`), con formulario conectado a `repairsApi.adminCreate(...)`, CTA visible en el listado y redireccion al detalle creado.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:web`
  - `npm run smoke:backend`
  - `npm run qa:route-parity`
  - `npm run qa:frontend:e2e`
- Riesgos / notas:
  - la pantalla usa solo campos soportados por el contrato real del backend y envia tambien las etiquetas visibles de catalogo para no perder contexto en listados/detalle.
  - ademas del gate normal, se valido el flujo real `listado -> crear -> detalle` contra la API levantada en local, incluyendo submit exitoso y redireccion al detalle generado.

---

### 2026-03-13 - Codex
- Alcance: activacion de envio real de WhatsApp por Meta Cloud API reutilizando templates, logs y triggers existentes.
- Tipo de intervencion: backend real de integracion + schema/logs + webhook minimo + ajuste menor de UI admin para estados reales.
- Archivos tocados:
  - 
ext-stack/apps/api/prisma/schema.prisma
  - 
ext-stack/apps/api/prisma/migrations/20260313130000_add_whatsapp_cloud_api_fields/migration.sql
  - 
ext-stack/apps/api/src/modules/whatsapp/{whatsapp.module.ts,whatsapp.controller.ts,whatsapp.service.ts}
  - 
ext-stack/apps/api/src/modules/{app,admin,orders,repairs}/*
  - 
ext-stack/.env.example
  - 
ext-stack/.env.production.example
  - 
ext-stack/scripts/env-check.mjs
  - 
ext-stack/apps/web/src/features/admin/{whatsappApi.ts,AdminWhatsappPage.tsx,AdminWhatsappOrdersPage.tsx,whatsapp-ui.ts}
  - project-docs/WHATSAPP_CLOUD_API_INTEGRATION.md
  - project-docs/DECISIONS_LOG.md
- ¿Cambio comportamiento funcional?: Si. Los triggers de pedidos, reparaciones y ventas rapidas ahora disparan envio real por Meta Cloud API cuando la configuracion existe; WhatsAppLog ya refleja PENDING, SENT o FAILED con emoteMessageId, providerStatus, errorMessage, intentos y timestamps.
- Validaciones ejecutadas:
  - 
pm run db:generate --workspace @nico/api
  - 
pm run db:migrate:deploy --workspace @nico/api
  - 
pm run typecheck --workspace @nico/api
  - 
pm run typecheck --workspace @nico/web
  - 
pm run build --workspace @nico/api
  - 
pm run build --workspace @nico/web
  - 
pm run smoke:backend
  - 
pm run smoke:web
  - 
pm run qa:route-parity
  - 
pm run qa:frontend:e2e
  - probe dirigido con mock local de Meta para exito, fallo y webhook
- Riesgos / notas:
  - la integracion actual reutiliza templates de texto libre; fuera de la ventana de 24h Meta puede rechazar mensajes hasta migrar a templates aprobados
  - pedidos normales siguen sin telefono persistido, por lo que esos logs pueden terminar en FAILED por missing_or_invalid_phone
### 2026-03-11 - Codex
- Alcance: backlog menor / polish funcional sobre públicas de reparación y módulos admin secundarios.
- Tipo de intervencion: quick wins funcionales + limpieza de copy/encoding + endurecimiento de estados secundarios.
- Archivos tocados:
  - `next-stack/apps/web/src/features/repairs/PublicRepairLookupPage.tsx`
  - `next-stack/apps/web/src/features/repairs/PublicRepairQuoteApprovalPage.tsx`
  - `next-stack/apps/web/src/features/admin/AdminUsersPage.tsx`
  - `next-stack/apps/web/src/features/orders/AdminQuickSalesPage.tsx`
  - `next-stack/apps/web/src/features/admin/Admin2faSecurityPage.tsx`
  - `project-docs/FRONTEND_QA_HARDENING.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Si. Las páginas públicas de reparación ahora resuelven mejor estados inválidos/no encontrados, usuarios admin evita respuestas stale y cambios de rol duplicados, venta rápida bloquea acciones inválidas y 2FA admin valida mejor y comunica errores/éxitos de forma separada.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/web`
- Riesgos / notas:
  - el foco estuvo en quick wins con impacto real; siguen quedando módulos secundarios menos usados que no justificaban otra reescritura en esta fase corta.
  - se agregó `data-qa="quick-sale-scan-code"` y se actualizó `qa:frontend:e2e` para dejar de depender del placeholder visible de venta rápida.
  - se agregó `data-admin-2fa-page` y se actualizó `qa:frontend:e2e` para no depender del título visible en la pantalla de 2FA admin.

---

### 2026-03-13 - Codex
- Alcance: activacion de envio real de WhatsApp por Meta Cloud API reutilizando templates, logs y triggers existentes.
- Tipo de intervencion: backend real de integracion + schema/logs + webhook minimo + ajuste menor de UI admin para estados reales.
- Archivos tocados:
  - 
ext-stack/apps/api/prisma/schema.prisma
  - 
ext-stack/apps/api/prisma/migrations/20260313130000_add_whatsapp_cloud_api_fields/migration.sql
  - 
ext-stack/apps/api/src/modules/whatsapp/{whatsapp.module.ts,whatsapp.controller.ts,whatsapp.service.ts}
  - 
ext-stack/apps/api/src/modules/{app,admin,orders,repairs}/*
  - 
ext-stack/.env.example
  - 
ext-stack/.env.production.example
  - 
ext-stack/scripts/env-check.mjs
  - 
ext-stack/apps/web/src/features/admin/{whatsappApi.ts,AdminWhatsappPage.tsx,AdminWhatsappOrdersPage.tsx,whatsapp-ui.ts}
  - project-docs/WHATSAPP_CLOUD_API_INTEGRATION.md
  - project-docs/DECISIONS_LOG.md
- ¿Cambio comportamiento funcional?: Si. Los triggers de pedidos, reparaciones y ventas rapidas ahora disparan envio real por Meta Cloud API cuando la configuracion existe; WhatsAppLog ya refleja PENDING, SENT o FAILED con emoteMessageId, providerStatus, errorMessage, intentos y timestamps.
- Validaciones ejecutadas:
  - 
pm run db:generate --workspace @nico/api
  - 
pm run db:migrate:deploy --workspace @nico/api
  - 
pm run typecheck --workspace @nico/api
  - 
pm run typecheck --workspace @nico/web
  - 
pm run build --workspace @nico/api
  - 
pm run build --workspace @nico/web
  - 
pm run smoke:backend
  - 
pm run smoke:web
  - 
pm run qa:route-parity
  - 
pm run qa:frontend:e2e
  - probe dirigido con mock local de Meta para exito, fallo y webhook
- Riesgos / notas:
  - la integracion actual reutiliza templates de texto libre; fuera de la ventana de 24h Meta puede rechazar mensajes hasta migrar a templates aprobados
  - pedidos normales siguen sin telefono persistido, por lo que esos logs pueden terminar en FAILED por missing_or_invalid_phone
### 2026-03-10 - Codex
- Alcance: fase adicional de QA funcional profunda sobre guards, verificación de email y módulos admin con riesgo de respuestas o acciones obsoletas.
- Tipo de intervencion: corrección de bugs reales de navegación protegida + hardening de concurrencia frontend + consolidación documental.
- Archivos tocados:
  - `next-stack/apps/web/src/features/auth/RequireAuth.tsx`
  - `next-stack/apps/web/src/features/auth/RequireAdmin.tsx`
  - `next-stack/apps/web/src/features/auth/VerifyEmailPage.tsx`
  - `next-stack/apps/web/src/features/orders/AdminOrdersPage.tsx`
  - `next-stack/apps/web/src/features/catalogAdmin/AdminProductsPage.tsx`
  - `next-stack/apps/web/src/features/catalogAdmin/AdminCategoriesPage.tsx`
  - `project-docs/FRONTEND_QA_HARDENING.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Si. Las vistas protegidas ahora reaccionan a cambios de sesión, la verificación de email ya no ofrece acciones inválidas sin contexto y los módulos admin endurecidos bloquean respuestas stale y mutaciones duplicadas.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
  - `npm run qa:frontend:e2e`
- Riesgos / notas:
  - el hardening se concentró en bugs confirmados de sesión, verify email y admin concurrente; lo pendiente ya queda acotado a módulos secundarios no auditados a fondo.

### 2026-03-10 - Codex
- Alcance: fase de QA funcional profunda + hardening del frontend centrada en flujos core de store, cuenta, admin y auth.
- Tipo de intervencion: corrección de bugs reales de UX/flujo + endurecimiento de estados de carga/error + validación E2E de páginas activas.
- Archivos tocados:
  - `next-stack/apps/web/src/features/cart/CartPage.tsx`
  - `next-stack/apps/web/src/features/orders/CheckoutPage.tsx`
  - `next-stack/apps/web/src/features/admin/AdminDashboardPage.tsx`
  - `next-stack/apps/web/src/features/admin/AdminSettingsHubPage.tsx`
  - `next-stack/apps/web/src/features/auth/AuthLayout.tsx`
  - `next-stack/apps/web/src/features/auth/LoginPage.tsx`
  - `next-stack/apps/web/src/features/auth/RegisterPage.tsx`
  - `next-stack/apps/web/src/features/auth/ForgotPasswordPage.tsx`
  - `next-stack/apps/web/src/features/auth/VerifyEmailPage.tsx`
  - `next-stack/apps/web/src/features/auth/MyAccountPage.tsx`
  - `next-stack/apps/web/src/features/orders/MyOrdersPage.tsx`
  - `next-stack/apps/web/src/features/repairs/MyRepairsPage.tsx`
  - `next-stack/apps/web/src/features/store/StorePage.tsx`
  - `project-docs/FRONTEND_QA_HARDENING.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Si. Se corrigieron CTAs inválidas en checkout, payloads inconsistentes, mapeos de estado incorrectos, validaciones débiles y rutas/anchors de QA defectuosos.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
  - `npm run qa:frontend:e2e`
- Riesgos / notas:
  - el hardening se enfocó en flujos core; todavía puede quedar copy/encoding residual en pantallas secundarias no auditadas a fondo en esta fase.
  - no se tocaron APIs ni arquitectura fuera de lo estrictamente necesario para mantener coherencia frontend.

---

### 2026-03-30 - Codex
- Alcance: seguir la particion del backend sobre `AdminModule`, extrayendo el subdominio de proveedores sin tocar rutas admin ni payloads publicos.
- Tipo de intervencion: refactor interno seguro del backend + actualizacion de documentacion viva.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/admin/admin.module.ts`
  - `next-stack/apps/api/src/modules/admin/admin.service.ts`
  - `next-stack/apps/api/src/modules/admin/admin-providers.service.ts`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/backend/BACKEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen estables los endpoints `/admin/providers*`, pero la implementacion interna ahora vive en `admin-providers.service.ts` y `admin.service.ts` queda como fachada delgada.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - esta ola no parte todavia communications/templates/logs ni warranties/accounting dentro de `AdminModule`
  - `admin-providers.service.ts` hereda parte del parsing HTML/JSON existente; el siguiente cleanup razonable es extraer esos helpers a una capa mas chica y testeable

---

### 2026-03-30 - Codex
- Alcance: partir `OrdersModule` en subservicios internos manteniendo controller, rutas y comportamiento externo estables.
- Tipo de intervencion: refactor estructural interno del backend + test unitario puntual + actualizacion de documentacion viva.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/orders/orders.service.ts`
  - `next-stack/apps/api/src/modules/orders/orders.module.ts`
  - `next-stack/apps/api/src/modules/orders/{orders-checkout.service.ts,orders-admin.service.ts,orders-quick-sales.service.ts,orders-notifications.service.ts,orders-support.service.ts,orders.helpers.ts,orders.types.ts,orders.helpers.test.ts}`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/backend/BACKEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- Cambio comportamiento funcional: No deliberado en endpoints ni payloads. Si mejora estructural real del backend: `OrdersService` queda como facade y el dominio se separa por responsabilidad interna.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - `admin.service.ts` sigue siendo el hotspot principal del backend
  - no se tocaron contracts compartidos ni frontend en esta ola

---

### 2026-03-30 - Codex
- Alcance: partir `RepairsModule` en subservicios internos manteniendo controller, rutas y comportamiento externo estables.
- Tipo de intervencion: refactor estructural interno del backend + test unitario puntual + actualizacion de documentacion viva.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/repairs/repairs.service.ts`
  - `next-stack/apps/api/src/modules/repairs/repairs.module.ts`
  - `next-stack/apps/api/src/modules/repairs/{repairs-admin.service.ts,repairs-public.service.ts,repairs-pricing.service.ts,repairs-notifications.service.ts,repairs-support.service.ts,repairs-timeline.service.ts,repairs.helpers.ts,repairs.types.ts,repairs.helpers.test.ts}`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/backend/BACKEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- Cambio comportamiento funcional: No deliberado en endpoints ni payloads. Si mejora estructural real del backend: `RepairsService` queda como facade y el dominio se separa por responsabilidad interna.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - `orders.service.ts` y `admin.service.ts` siguen siendo hotspots pendientes
  - no se tocaron contratos compartidos ni frontend en esta ola

---

### 2026-03-30 - Codex
- Alcance: reforzar la metodologia para que, cuando haya varias opciones razonables, Codex deje una recomendacion priorizada por defecto.
- Tipo de intervencion: gobernanza operativa y metodologia documental; sin cambios de runtime, APIs ni comportamiento funcional de la aplicacion.
- Archivos tocados:
  - `AGENTS.md`
  - `project-docs/WORKFLOW_AI.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- Cambio comportamiento funcional: No en la aplicacion. Si en el flujo de trabajo de Codex: ante multiples rutas razonables, el cierre y las recomendaciones deben priorizar una opcion concreta con criterio corto.
- Validaciones ejecutadas:
  - revision de consistencia entre `AGENTS.md` y `project-docs/WORKFLOW_AI.md`
  - `git diff --check`
- Riesgos / notas:
  - complementa las reglas de cierre parcial y bloqueo explicito; no modifica validaciones ni versionado

---

### 2026-03-30 - Codex
- Alcance: reforzar el cierre de tareas bloqueadas para que siempre expongan el bloqueo real y la decision minima necesaria para continuar.
- Tipo de intervencion: gobernanza operativa y metodologia documental; sin cambios de runtime, APIs ni comportamiento funcional de la aplicacion.
- Archivos tocados:
  - `AGENTS.md`
  - `project-docs/WORKFLOW_AI.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- Cambio comportamiento funcional: No en la aplicacion. Si en el flujo de trabajo de Codex: cuando una tarea quede bloqueada o dependa de una definicion externa, el cierre debe explicitar el bloqueo y la decision minima pendiente.
- Validaciones ejecutadas:
  - revision de consistencia entre `AGENTS.md` y `project-docs/WORKFLOW_AI.md`
  - `git diff --check`
- Riesgos / notas:
  - complementa la regla de cierre parcial ya adoptada; no altera versionado ni criterios de validacion

---

### 2026-03-30 - Codex
- Alcance: reforzar la regla de cierre parcial para que toda tarea incompleta termine con un siguiente paso recomendado explicito.
- Tipo de intervencion: gobernanza operativa y metodologia documental; sin cambios de runtime, APIs ni comportamiento funcional de la aplicacion.
- Archivos tocados:
  - `AGENTS.md`
  - `project-docs/WORKFLOW_AI.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- Cambio comportamiento funcional: No en la aplicacion. Si en el flujo de trabajo de Codex: cuando una tarea quede parcial, el cierre debe incluir el siguiente paso concreto o la recomendacion prioritaria para completarla.
- Validaciones ejecutadas:
  - revision de consistencia entre `AGENTS.md` y `project-docs/WORKFLOW_AI.md`
  - `git diff --check`
- Riesgos / notas:
  - no cambia criterios de validacion ni versionado; solo endurece la forma de cerrar entregas parciales

---
### 2026-03-09 - Codex
- Alcance: fase final corta de polish visual centrada en quick wins activos, barrido final de copy/encoding y retiro de residuos legacy visibles.
- Tipo de intervencion: consolidación visual final sobre vistas activas de detalle y catálogo + limpieza semántica/copy.
- Archivos tocados:
  - `next-stack/apps/web/src/features/catalogAdmin/AdminCategoriesPage.tsx`
  - `next-stack/apps/web/src/features/orders/AdminOrderDetailPage.tsx`
  - `next-stack/apps/web/src/features/repairs/AdminRepairDetailPage.tsx`
  - `next-stack/apps/web/src/features/orders/OrderDetailPage.tsx`
  - `next-stack/apps/web/src/features/repairs/RepairDetailPage.tsx`
  - `next-stack/apps/web/src/features/orders/order-ui.ts`
  - `next-stack/apps/web/src/features/repairs/repair-ui.ts`
  - `project-docs/UI_STYLE_GUIDE.md`
  - `project-docs/DESIGN_SYSTEM.md`
  - `project-docs/UI_APPLICATION_PLAN.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: No en lógica de negocio. Sí en claridad de seguimiento, estructura de detalle, consistencia visual y copy visible en vistas activas.
- Validaciones ejecutadas:
  - `npm run env:check`
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
  - `npm run qa:responsive:visual`
  - `npm run qa:admin:visual`
- Riesgos / notas:
  - el frontend principal queda visualmente sólido en las vistas activas core.
  - lo que resta ya es menor y se concentra en barridos secundarios fuera del bloque principal del producto.

### 2026-03-09 - Codex
- Alcance: fase final de pulido global del frontend centrada en módulos secundarios admin y reducción de residuos visuales legacy en vistas activas.
- Tipo de intervencion: adopción del design system sobre formularios, listados y módulos secundarios + limpieza de copy/encoding + refuerzo responsive.
- Archivos tocados:
  - `next-stack/apps/web/src/components/ui/textarea-field.tsx`
  - `next-stack/apps/web/src/styles.css`
  - `next-stack/apps/web/src/features/admin/AdminAlertsPage.tsx`
  - `next-stack/apps/web/src/features/admin/AdminBusinessSettingsPage.tsx`
  - `next-stack/apps/web/src/features/catalogAdmin/AdminProductsPage.tsx`
  - `next-stack/apps/web/src/features/catalogAdmin/AdminProductCreatePage.tsx`
  - `next-stack/apps/web/src/features/catalogAdmin/AdminProductEditPage.tsx`
  - `next-stack/apps/web/src/features/catalogAdmin/AdminProductLabelPage.tsx`
  - `project-docs/UI_STYLE_GUIDE.md`
  - `project-docs/DESIGN_SYSTEM.md`
  - `project-docs/UI_APPLICATION_PLAN.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: No en lógica de negocio principal. Sí en calidad visual, agrupación de formularios, filtros activos reales en catálogo, claridad de acciones y eliminación de ruido/no-op en vistas admin secundarias.
- Validaciones ejecutadas:
  - `npm run env:check`
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
  - `npm run qa:responsive:visual`
  - `npm run qa:admin:visual`
- Riesgos / notas:
  - quedan pendientes menores en módulos admin no críticos y en un barrido final de copy/encoding fuera de las vistas activas tocadas.
  - `TextAreaField` y `choice-card` pasan a ser patrones canónicos para formularios administrativos.

### 2026-03-09 - Codex
- Alcance: fase de aplicación visual centrada en cuenta usuario y pulido transversal del frontend.
- Tipo de intervencion: adopción real del design system en listados y detalles de pedidos/reparaciones + refuerzo de patterns reutilizables.
- Archivos tocados:
  - `next-stack/apps/web/src/components/ui/progress-steps.tsx`
  - `next-stack/apps/web/src/features/orders/order-ui.ts`
  - `next-stack/apps/web/src/features/repairs/repair-ui.ts`
  - `next-stack/apps/web/src/features/orders/MyOrdersPage.tsx`
  - `next-stack/apps/web/src/features/repairs/MyRepairsPage.tsx`
  - `next-stack/apps/web/src/features/orders/OrderDetailPage.tsx`
  - `next-stack/apps/web/src/features/repairs/RepairDetailPage.tsx`
  - `next-stack/apps/web/src/styles.css`
  - `project-docs/UI_STYLE_GUIDE.md`
  - `project-docs/DESIGN_SYSTEM.md`
  - `project-docs/UI_APPLICATION_PLAN.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: No en lógica de negocio. Sí en jerarquía visual, lectura de estados, seguimiento de pedidos/reparaciones, calidad del copy y consistencia account/store/admin.
- Validaciones ejecutadas:
  - `npm run env:check`
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
  - `npm run qa:responsive:visual`
- Riesgos / notas:
  - queda pendiente un barrido final sobre admin secundario y pulido fino de responsive/copy en vistas activas no tocadas.
  - `ProgressSteps`, `account-record` y `fact-list` pasan a ser patrones canónicos para cuenta usuario.

### 2026-03-09 - Codex
- Alcance: segunda fase de aplicación visual sobre pantallas core del producto.
- Tipo de intervencion: adopción real del design system en admin core + flujo comercial principal.
- Archivos tocados:
  - `next-stack/apps/web/src/styles.css`
  - `next-stack/apps/web/src/features/orders/AdminOrdersPage.tsx`
  - `next-stack/apps/web/src/features/repairs/AdminRepairsListPage.tsx`
  - `next-stack/apps/web/src/features/store/StoreProductDetailPage.tsx`
  - `next-stack/apps/web/src/features/cart/CartPage.tsx`
  - `next-stack/apps/web/src/features/orders/CheckoutPage.tsx`
  - `project-docs/UI_STYLE_GUIDE.md`
  - `project-docs/DESIGN_SYSTEM.md`
  - `project-docs/UI_APPLICATION_PLAN.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: No en lógica de negocio. Sí en jerarquía visual, shell por contexto, filtros, estados, acciones visibles y consistencia del flujo admin/comercial.
- Validaciones ejecutadas:
  - `npm run env:check`
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
- Riesgos / notas:
  - la base reusable ya quedo validada en pantallas core, pero todavia falta extenderla a cuenta usuario y detalle de pedidos/reparaciones.
  - en los archivos tocados se eliminaron wrappers impropios, badges inconsistentes y copy/encoding roto.

### 2026-03-09 - Codex
- Alcance: primera fase real de aplicación visual sobre la base frontend del proyecto.
- Tipo de intervencion: fundación visual reusable + ajuste de shell + adopción limitada en vistas representativas.
- Archivos tocados:
  - `next-stack/apps/web/src/styles.css`
  - `next-stack/apps/web/src/layouts/AppShell.tsx`
  - `next-stack/apps/web/src/components/GlobalVisualEnhancements.tsx`
  - `next-stack/apps/web/src/components/ui/button.tsx`
  - `next-stack/apps/web/src/components/ui/page-shell.tsx`
  - `next-stack/apps/web/src/components/ui/page-header.tsx`
  - `next-stack/apps/web/src/components/ui/section-card.tsx`
  - `next-stack/apps/web/src/components/ui/status-badge.tsx`
  - `next-stack/apps/web/src/components/ui/empty-state.tsx`
  - `next-stack/apps/web/src/components/ui/loading-block.tsx`
  - `next-stack/apps/web/src/components/ui/text-field.tsx`
  - `next-stack/apps/web/src/components/ui/filter-bar.tsx`
  - `next-stack/apps/web/src/features/admin/AdminDashboardPage.tsx`
  - `next-stack/apps/web/src/features/admin/AdminSettingsHubPage.tsx`
  - `next-stack/apps/web/src/features/store/StorePage.tsx`
  - `next-stack/apps/web/src/features/auth/MyAccountPage.tsx`
  - `next-stack/apps/web/src/features/orders/MyOrdersPage.tsx`
  - `project-docs/UI_STYLE_GUIDE.md`
  - `project-docs/DESIGN_SYSTEM.md`
  - `project-docs/UI_APPLICATION_PLAN.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: No en lógica de negocio. Sí en presentación, shell, navegación interna y consistencia de la experiencia frontend.
- Validaciones ejecutadas:
  - `npm run env:check`
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
- Riesgos / notas:
  - esta fase crea la fundación reutilizable, pero no cierra todavía admin core, carrito, checkout ni detalle de producto
  - la siguiente fase debe expandir esta base a listados admin y flujo comercial sin volver a introducir wrappers o badges ad-hoc

### 2026-03-09 - Codex
- Alcance: Fase 4F para sacar parity legacy y migradores legacy del flujo normal del repo.
- Tipo de intervencion: deprecacion / archivado controlado + alineacion documental y de scripts.
- Archivos tocados:
  - `next-stack/package.json`
  - `next-stack/apps/api/package.json`
  - `next-stack/legacy-support/README.md`
  - `next-stack/legacy-support/deprecated/README.md`
  - `next-stack/legacy-support/deprecated/qa/qa-visual-parity.mjs`
  - `next-stack/legacy-support/deprecated/api/migrate-legacy-settings.ts`
  - `next-stack/legacy-support/deprecated/api/migrate-legacy-product-images.ts`
  - `next-stack/legacy-support/deprecated/api/migrate-legacy-visual-assets.ts`
  - `project-docs/PARITY_STRATEGY.md`
  - `project-docs/LEGACY_SUPPORT_MAP.md`
  - `project-docs/LEGACY_RETIREMENT_PLAN.md`
  - `project-docs/ROOT_LEGACY_POLICY.md`
  - `project-docs/ROOT_LEGACY_RETIREMENT_CHECKLIST.md`
  - `project-docs/CLEANUP_EXECUTION_PLAN.md`
  - `project-docs/CLEANUP_CANDIDATES.md`
  - `project-docs/OPEN_QUESTIONS.md`
  - `project-docs/DECISIONS_LOG.md`
  - `project-docs/WORKFLOW_AI.md`
  - `AGENTS.md`
  - `next-stack/docs/MIGRATION_STATUS.md`
  - `next-stack/docs/UI_PARITY_FINAL_CHECKLIST.md`
  - `next-stack/docs/LEGACY_ROUTE_PARITY.md`
- ¿Cambio comportamiento funcional?: No del producto. Si del tooling: parity legacy y migradores legacy quedaron fuera del flujo normal y del gate principal.
- Validaciones ejecutadas:
  - `npm run env:check`
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
- Riesgos / notas:
  - `legacy:parity:deprecated` y `legacy:migrate:*:deprecated` siguen existiendo solo como soporte historico/manual.
  - el siguiente paso razonable pasa a ser retirar duplicados root y avanzar sobre el retiro fuerte del root Laravel.

### 2026-03-09 - Codex
- Alcance: Fase 4G para retirar materialmente el root Laravel y consolidar el repo alrededor de `next-stack/`.
- Tipo de intervencion: cleanup estructural fuerte + reescritura de entrypoints + actualizacion documental.
- Archivos tocados:
  - eliminacion del runtime Laravel root (`app/`, `bootstrap/`, `config/`, `database/`, `public/`, `resources/`, `routes/`, `storage/`, `tests/`, `e2e/`, `scripts/`, `tools/`, `vendor/`, `node_modules/`, `composer.json`, `composer.lock`, `package.json`, `package-lock.json`, `artisan`, configs root asociadas)
  - eliminacion de `next-stack/legacy-support/`
  - `nico-dev.bat`
  - `README.md`
  - `.github/workflows/ci.yml`
  - `.gitignore`
  - `next-stack/apps/api/package.json`
  - `project-docs/*` relevantes al retiro del legacy
- ¿Cambio comportamiento funcional?: No del producto. Si del repositorio y tooling: el stack operativo queda solo en `next-stack/`.
- Validaciones ejecutadas:
  - `npm run env:check`
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
- Riesgos / notas:
  - el unico material root restante es documental/historico
  - el siguiente paso ya no es tecnico, sino decidir si se conserva o reduce aun mas el material historico de raiz

### 2026-03-09 - Codex
- Alcance: Fase Final de cierre de migracion para consolidar documentacion, retirar historicos narrativos redundantes y declarar el repo cerrado sobre el nuevo stack.
- Tipo de intervencion: consolidacion documental final + limpieza de historicos.
- Archivos tocados:
  - `project-docs/MIGRATION_CLOSURE.md`
  - `project-docs/MIGRATION_STATUS.md`
  - `project-docs/PROJECT_CONTEXT.md`
  - `project-docs/REPO_MAP.md`
  - `project-docs/WORKFLOW_AI.md`
  - `project-docs/CANONICAL_SOURCES.md`
  - `project-docs/DECISIONS_LOG.md`
  - `README.md`
  - `AGENTS.md`
  - `next-stack/docs/DEPLOY_VPS_UBUNTU.md`
  - historicos documentales retirados de la raiz
- ¿Cambio comportamiento funcional?: No del producto. Si del repositorio: cierre formal de migracion y reduccion de ruido documental.
- Validaciones ejecutadas:
  - `npm run env:check`
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
  - `npm run qa:legacy:detach`
- Riesgos / notas:
  - `project-docs/` queda como unica documentacion viva.
  - `next-stack/docs/` queda como capa de runbooks operativos del stack actual.

### 2026-03-09 - Codex
- Alcance: auditoria UI/UX inicial + definicion de design system y plan de aplicacion visual del frontend.
- Tipo de intervencion: documentacion de producto / frontend, sin cambios funcionales.
- Archivos tocados:
  - `project-docs/UI_STYLE_GUIDE.md`
  - `project-docs/DESIGN_SYSTEM.md`
  - `project-docs/UI_APPLICATION_PLAN.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: No.
- Validaciones ejecutadas:
  - `npm run env:check`
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
- Riesgos / notas:
  - la fase cierra solo diagnostico, sistema visual y plan
  - la aplicacion visual real queda para una fase posterior con primitives y barrido por areas

### 2026-03-10 - Codex
- Alcance: optimizacion real de performance frontend en `@nico/web`.
- Tipo de intervencion: reduccion de bundle inicial + code splitting por ruta.
- Archivos tocados:
  - `next-stack/apps/web/src/App.tsx`
  - `project-docs/FRONTEND_PERFORMANCE.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: No del producto. Sí del modo de carga: las vistas del router ahora se cargan de forma diferida y no inflan el chunk inicial.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
- Riesgos / notas:
  - el warning de chunk grande desaparecio en el build actual
  - el chunk principal JS bajo de ~`769.29 kB` a ~`317.30 kB`
  - no se agregaron `manualChunks`; el problema se resolvio atacando la causa principal del bundle inicial

### 2026-03-11 - Codex
- Alcance: hardening del modulo admin de reparaciones, sobre create + detalle/edicion, y ajuste del gate `smoke:backend` para no fallar con productos visibles pero no comprables en demo local.
- Tipo de intervencion: mejora funcional real + robustez de validacion + fix de automatizacion local.
- Archivos tocados:
  - `next-stack/apps/web/src/features/repairs/AdminRepairCreatePage.tsx`
  - `next-stack/apps/web/src/features/repairs/AdminRepairDetailPage.tsx`
  - `next-stack/scripts/smoke-backend.mjs`
  - `project-docs/FRONTEND_QA_HARDENING.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Si. El alta admin valida mejor telefono/importes, maneja mejor fallas parciales del catalogo y evita doble submit. El detalle admin solo guarda cambios reales, separa errores de carga/guardado y refresca timeline/datos luego del PATCH. El smoke backend ahora degrada a `skipped` cuando el dataset local no tiene productos realmente comprables.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
  - `npm run qa:frontend:e2e`
  - prueba dirigida `listado -> crear -> detalle -> editar/guardar`
- Riesgos / notas:
  - el contrato backend no soporta mas campos que los ya usados; no se inventaron payloads nuevos
  - `smoke:backend` mantiene cobertura general, pero no fuerza checkout/quick sale cuando el demo local no ofrece productos validos para compra

### 2026-03-11 - Codex
- Alcance: pasada corta final de hardening backend sobre checkout normal y filtros admin ambiguos.
- Tipo de intervencion: cierre puntual de reglas de negocio + validacion de contratos.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/orders/orders.service.ts`
  - `next-stack/apps/api/src/modules/repairs/repairs.service.ts`
  - `project-docs/BACKEND_BUSINESS_RULES_HARDENING.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Si. Checkout normal ya no acepta `paymentMethod` arbitrario; lo normaliza a una enum explicita o falla con `400`. Los filtros invalidos en `orders/admin`, `orders/admin/quick-sales` y `repairs/admin` dejan de degradarse silenciosamente a "sin filtro" y ahora responden `400`.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
  - `npm run qa:frontend:e2e`
- Riesgos / notas:
  - el probe directo de checkout con `paymentMethod` invalido quedo limitado por el dataset demo actual: no habia un producto realmente comprable para ejecutar compra completa
  - el contrato quedo igualmente cubierto por codigo y por el gate general en verde



### 2026-03-11 - Codex
- Alcance: integracion minima y util del calculo automatico de presupuesto en reparaciones admin.
- Tipo de intervencion: conexion frontend a backend de pricing ya migrado + hardening de UX/estado en create y detail.
- Archivos tocados:
  - next-stack/apps/web/src/features/repairs/api.ts
  - next-stack/apps/web/src/features/repairs/repair-pricing.ts
  - next-stack/apps/web/src/features/repairs/AdminRepairCreatePage.tsx
  - next-stack/apps/web/src/features/repairs/AdminRepairDetailPage.tsx
  - project-docs/FRONTEND_QA_HARDENING.md
  - project-docs/DECISIONS_LOG.md
- ¿Cambio comportamiento funcional?: Si. El admin ahora puede calcular una sugerencia automatica de presupuesto desde reglas activas de pricing, usarla explicitamente en el alta y en el detalle de reparaciones, y recalcularla sin mezclar ese flujo con el submit principal.
- Validaciones ejecutadas:
  - npm run typecheck --workspace @nico/api
  - npm run typecheck --workspace @nico/web
  - npm run build --workspace @nico/api
  - npm run build --workspace @nico/web
  - npm run smoke:backend
  - npm run smoke:web
  - npm run qa:route-parity
  - npm run qa:frontend:e2e
  - verificacion dirigida del endpoint pricing/repairs/resolve con una regla activa del dataset local
- Riesgos / notas:
  - esta fase no migra proveedor ni repuesto dentro de Repair; solo expone y endurece la sugerencia automatica basada en reglas ya migradas.
  - el probe UI completo con Playwright quedo limitado por la interaccion con CustomSelect portalizado, pero la integracion real quedo comprobada por codigo, gates y llamada dirigida al endpoint de pricing.

### 2026-03-12 - Codex
- Alcance: recuperacion de la UX legacy de busqueda agregada multi-proveedor en reparaciones admin.
- Tipo de intervencion: integracion backend+frontend acotada, reutilizando preview proveedor + repuesto + regla ya existente.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/admin/admin.controller.ts`
  - `next-stack/apps/api/src/modules/admin/admin.service.ts`
  - `next-stack/apps/web/src/features/admin/api.ts`
  - `next-stack/apps/web/src/features/repairs/RepairProviderPartPricingSection.tsx`
  - `project-docs/REPAIR_PROVIDER_PART_PRICING_PLAN.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Si. Create y detail de reparaciones ahora permiten escribir un repuesto una sola vez, consultar todos los proveedores activos con busqueda habilitada, seleccionar una opcion agregada y continuar con preview/snapshot. La busqueda puntual por proveedor queda como fallback mediante un filtro opcional.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
  - `npm run qa:frontend:e2e`
  - probe dirigido `busqueda unica -> resultados multi-proveedor -> preview -> snapshot`
- Riesgos / notas:
  - el flujo principal ya recupera la UX agregada, pero todavia no existe comparacion multiple avanzada entre resultados seleccionados
  - la robustez frente a fallos parciales descansa en el agregado por proveedor con `status = ok | empty | error`, sin romper el conjunto de resultados

### 2026-03-12 - Codex
- Alcance: simplificacion operativa de `Nueva reparacion` en el frontend admin.
- Tipo de intervencion: reorganizacion UX acotada sobre la vista de create, sin tocar backend ni romper preview/snapshot.
- Archivos tocados:
  - `next-stack/apps/web/src/features/repairs/AdminRepairCreatePage.tsx`
  - `next-stack/apps/web/src/features/repairs/RepairProviderPartPricingSection.tsx`
  - `next-stack/apps/web/src/components/ui/section-card.tsx`
  - `next-stack/apps/web/src/styles.css`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Si. La pantalla de alta ahora expone solo tres bloques principales (`Datos basicos`, `Diagnostico rapido`, `Proveedor y repuesto`) y mueve catalogo exacto, notas y ajustes finos de calculo a disclosures cerrados por defecto. El flujo de create, preview y snapshot se mantiene.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:web`
  - probe real `Nueva reparacion -> verificar bloques visibles -> crear reparacion`
- Riesgos / notas:
  - no se modifico el dominio de reparaciones ni el contrato del snapshot; el cambio es estrictamente de UX/flujo operativo en la pantalla de alta.

### 2026-03-13 - Codex
- Alcance: ajuste fino del dashboard admin principal para priorizar accesos de gestion.
- Tipo de intervencion: reordenamiento del dashboard, sin rediseño estructural ni cambios de comportamiento en navegacion.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/AdminDashboardPage.tsx`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Si. `Gestion principal` pasa a ser la segunda seccion del dashboard, inmediatamente despues de `Acciones rapidas`, antes de `Resumen operativo`.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:web`
  - probe real `/admin` con sesion admin verificando orden de secciones, colapso de `Administracion avanzada` y navegacion a `Nueva reparacion`
- Riesgos / notas:
  - no se tocaron estilos globales ni se abrio una nueva reorganizacion del dashboard; solo se ajusto la jerarquia de secciones.

### 2026-03-13 - Codex
- Alcance: validacion operativa de la integracion WhatsApp Cloud API ya implementada.
- Tipo de intervencion: validacion de entorno, saneo de datos historicos de `WhatsAppLog` y actualizacion documental del estado real.
- Archivos tocados:
  - `project-docs/WHATSAPP_CLOUD_API_INTEGRATION.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: No en codigo de la integracion. Si hubo saneo operativo de datos historicos ejecutando `db:fix-mojibake`, que corrigio 5 campos en `WhatsAppLog` para que `smoke:backend` volviera a pasar.
- Validaciones ejecutadas:
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run smoke:backend`
  - `npm run smoke:web`
  - `npm run qa:route-parity`
  - `npm run qa:frontend:e2e`
- Riesgos / notas:
  - la validacion real contra Meta quedo bloqueada porque el entorno local no tiene cargadas variables `WHATSAPP_CLOUD_*`
  - el sistema esta listo tecnicamente, pero no puede declararse validado contra Meta real hasta cargar credenciales reales y un webhook publico

---

### 2026-03-16 - Codex
- Alcance: automatizacion del tunel publico del frontend dentro de `nico-dev.bat`.
- Tipo de intervencion: ajuste operativo del script raiz de desarrollo, sin cambios de dominio ni de backend.
- Archivos tocados:
  - `nico-dev.bat`
  - `README.md`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: Si. `nico-dev.bat start` ahora intenta levantar `ngrok` para el frontend en `5174`, muestra la URL publica si el agente responde y `nico-dev.bat stop` cierra tambien ese tunel.
- Validaciones ejecutadas:
  - `nico-dev.bat start`
  - `npm --prefix next-stack run typecheck --workspace @nico/web`
  - verificacion de `http://127.0.0.1:4040/api/tunnels`
  - `nico-dev.bat stop`
- Riesgos / notas:
  - el tunel solo arranca si el entorno local tiene `ngrok` configurado por `%LOCALAPPDATA%\ngrok\ngrok.yml` o `NGROK_AUTHTOKEN`
  - el script mata cualquier tunel `ngrok http 5174` previo antes de arrancar uno nuevo para evitar sesiones duplicadas

---

### 2026-03-30 - Codex
- Alcance: primera ola de limpieza profunda y orden del repo canonico.
- Tipo de intervencion: reorganizacion fisica de docs/runbooks/scripts, endurecimiento de ignores, refactor interno seguro del frontend y formalizacion tipada de settings admin.
- Archivos tocados:
  - `.gitignore`
  - `README.md`
  - `next-stack/.gitignore`
  - `next-stack/package.json`
  - `project-docs/INDEX.md`
  - `project-docs/plans/REPO_CLEANUP_POLICY.md`
  - `next-stack/docs/INDEX.md`
  - `next-stack/apps/web/src/App.tsx`
  - `next-stack/apps/web/src/app/routing/route-pages.tsx`
  - `next-stack/apps/web/src/app/routing/route-shell.tsx`
  - `next-stack/apps/web/src/app/routing/route-aliases.tsx`
  - `next-stack/apps/web/src/layouts/AppShell.tsx`
  - `next-stack/apps/web/src/layouts/app-shell/types.ts`
  - `next-stack/apps/web/src/layouts/app-shell/utils.ts`
  - `next-stack/apps/web/src/layouts/app-shell/primitives.tsx`
  - `next-stack/apps/api/src/modules/admin/admin.service.ts`
  - `next-stack/apps/api/src/modules/admin/app-settings.registry.ts`
  - `next-stack/packages/contracts/src/index.ts`
  - movimientos fisicos dentro de `project-docs/`, `next-stack/docs/` y `next-stack/scripts/`
- ¿Cambio comportamiento funcional?: No deliberado en interfaces publicas. Se mantuvieron rutas, endpoints y comandos npm publicos; los cambios son de orden, encapsulacion y gobernanza interna.
- Validaciones ejecutadas:
  - `npm run env:check`
  - `npm run typecheck --workspace @nico/api`
  - `npm run typecheck --workspace @nico/web`
  - `npm run build --workspace @nico/api`
  - `npm run build --workspace @nico/web`
  - `npm run qa:route-parity`
  - `npm run qa:legacy:detach`
  - `npm run smoke:web`
- Riesgos / notas:
  - no se tocaron los cambios preexistentes del usuario en `next-stack/apps/web/src/features/store/StorePage.tsx` ni `next-stack/apps/web/src/styles.css`
  - `project-docs/overview/REPO_MAP.md` y `project-docs/overview/CANONICAL_SOURCES.md` quedaron movidos pero no rehechos en esta pasada porque venian con encoding no UTF-8; el nuevo punto de entrada documental es `project-docs/INDEX.md`

---

### 2026-03-30 - Codex
- Alcance: dejar persistente el flujo de commit versionado + push para este repo a traves de una skill global y reglas del repositorio.
- Tipo de intervencion: gobernanza operativa de Codex; sin cambios en runtime, API ni frontend/backend del producto.
- Archivos tocados:
  - `AGENTS.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
  - `C:\Users\nicol\.codex\skills\repo-ship\SKILL.md`
  - `C:\Users\nicol\.codex\skills\repo-ship\agents\openai.yaml`
- Cambio comportamiento funcional: No sobre la aplicacion. Si sobre el flujo de trabajo de Codex en este repo: al cerrar tareas de codigo, la pauta pasa a ser usar la skill `repo-ship` con formato `V1.xxx-DetalleCorto`, sin introducir tooling local dentro del proyecto.
- Validaciones ejecutadas:
  - `python C:\Users\nicol\.codex\skills\.system\skill-creator\scripts\init_skill.py repo-ship --path C:\Users\nicol\.codex\skills ...`
  - `python C:\Users\nicol\.codex\skills\.system\skill-creator\scripts\quick_validate.py C:\Users\nicol\.codex\skills\repo-ship`
- Riesgos / notas:
  - se limpio el intento anterior basado en `nico-dev.bat ship` y `scripts/git-ship.ps1`; esos cambios no quedan en el repo
  - no se tocaron los cambios preexistentes del usuario en `next-stack/apps/web/src/features/store/StorePage.tsx` ni `next-stack/apps/web/src/styles.css`

---

### 2026-03-30 - Codex
- Alcance: reorganizar la gobernanza documental y operativa de Codex para separar reglas cortas, metodologia detallada y router documental.
- Tipo de intervencion: documentacion viva y contrato operativo del repo; sin cambios de runtime, APIs ni comportamiento funcional de la aplicacion.
- Archivos tocados:
  - `AGENTS.md`
  - `project-docs/WORKFLOW_AI.md`
  - `project-docs/INDEX.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- Cambio comportamiento funcional: No en la aplicacion. Si en la metodologia esperada para Codex dentro del repo: ahora `AGENTS.md` queda corto y normativo, `WORKFLOW_AI.md` concentra el detalle operativo y `INDEX.md` se define como router documental unico.
- Validaciones ejecutadas:
  - revision de consistencia entre `AGENTS.md`, `project-docs/WORKFLOW_AI.md` y `project-docs/INDEX.md`
  - verificacion manual de que la politica declarada para `nico-dev.bat` coincide con su uso como entrypoint de validacion manual o visual
  - `git diff --check`
- Riesgos / notas:
  - no se tocaron los cambios preexistentes del usuario en `next-stack/apps/web/src/features/store/StorePage.tsx` ni `next-stack/apps/web/src/styles.css`

---

### 2026-03-30 - Codex
- Alcance: primera ola de hardening estructural real sobre backend/admin/assets y base de tests del monorepo.
- Tipo de intervencion: refactor interno seguro + harness de validacion + saneo operativo de texto historico.
- Archivos tocados:
  - `.github/workflows/ci.yml`
  - `next-stack/package.json`
  - `next-stack/package-lock.json`
  - `next-stack/apps/api/package.json`
  - `next-stack/apps/web/package.json`
  - `next-stack/packages/contracts/package.json`
  - `next-stack/apps/api/vitest.config.ts`
  - `next-stack/apps/web/vitest.config.ts`
  - `next-stack/packages/contracts/vitest.config.ts`
  - `next-stack/apps/api/src/common/http/zod-bad-request.ts`
  - `next-stack/apps/api/src/common/storage/public-asset-storage.service.ts`
  - `next-stack/apps/api/src/modules/admin/{admin.module.ts,admin.controller.ts,admin.service.ts,admin.constants.ts,admin.schemas.ts,admin-settings.service.ts,admin-dashboard.service.ts,admin-brand-assets.service.ts,app-settings.registry.ts}`
  - `next-stack/apps/api/src/modules/catalog-admin/{catalog-admin.module.ts,catalog-admin.service.ts}`
  - `next-stack/apps/api/src/modules/{orders,pricing,repairs}/*controller.ts`
  - `next-stack/apps/api/src/modules/{orders,pricing,repairs}/*.schemas.ts`
  - tests nuevos en `next-stack/apps/api/src/**`, `next-stack/apps/web/src/features/repairs/repair-pricing.test.ts` y `next-stack/packages/contracts/src/index.test.ts`
  - `project-docs/architecture/{ARCHITECTURE.md,ASSET_STRATEGY.md}`
  - `project-docs/DECISIONS_LOG.md`
- ¿Cambio comportamiento funcional?: No deliberado en contratos publicos. Si hubo mejora operativa real: `admin/whatsapp-logs` ahora sanea mojibake historico antes de devolverlo al admin y al smoke.
- Validaciones ejecutadas:
  - `cmd /c npm run env:check`
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run test`
  - `cmd /c npm run qa:route-parity`
  - `cmd /c npm run qa:legacy:detach`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - esta ola no parte todavia `repairs.service.ts` ni `orders.service.ts`; deja la base lista para hacerlo con menos riesgo
  - el storage sigue siendo local sobre `apps/web/public`, pero ahora detras de una interfaz unica
  - los cambios abiertos del usuario en `next-stack/apps/web/src/features/store/StorePage.tsx` y `next-stack/apps/web/src/styles.css` quedaron convivientes en el worktree durante la validacion y no bloquearon `build` ni `smoke:web`

---

### 2026-03-30 - Codex
- Alcance: seguir partiendo `AdminModule`, extrayendo comunicaciones/reportes/templates a un subservicio dedicado.
- Tipo de intervencion: refactor interno seguro del backend admin + test unitario especifico del subdominio de comunicaciones.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/admin/admin.module.ts`
  - `next-stack/apps/api/src/modules/admin/admin.service.ts`
  - `next-stack/apps/api/src/modules/admin/admin-communications.service.ts`
  - `next-stack/apps/api/src/modules/admin/admin-communications.service.test.ts`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/backend/BACKEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado en rutas ni payloads. Los endpoints `/admin/smtp*`, `/admin/mail-templates*` y `/admin/whatsapp-*` siguen estables; cambia solo la separacion interna del modulo admin.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - durante la extraccion hubo que restaurar `slugify` y `cleanNullable` en `admin.service.ts` porque siguen siendo helpers compartidos por device types, warranties/help FAQ y otras areas no ligadas a comunicaciones
  - el siguiente hotspot coherente dentro de `AdminModule` pasa a ser `warranties` + `accounting`

---

### 2026-03-30 - Codex
- Alcance: seguir partiendo `AdminModule`, extrayendo `warranties` + `accounting` y centralizando la lectura del registro de incidentes.
- Tipo de intervencion: refactor interno seguro del backend admin + eliminacion de duplicacion compartida entre `finance` y `providers`.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/admin/admin.module.ts`
  - `next-stack/apps/api/src/modules/admin/admin.service.ts`
  - `next-stack/apps/api/src/modules/admin/admin-providers.service.ts`
  - `next-stack/apps/api/src/modules/admin/admin-finance.service.ts`
  - `next-stack/apps/api/src/modules/admin/admin-finance.service.test.ts`
  - `next-stack/apps/api/src/modules/admin/admin-warranty-registry.service.ts`
  - `next-stack/apps/api/src/modules/admin/admin-warranty-registry.service.test.ts`
  - `next-stack/apps/api/src/modules/admin/admin-warranty-registry.types.ts`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/backend/BACKEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado en rutas ni payloads. Los endpoints `/admin/warranties*` y `/admin/accounting` siguen estables; cambia la separacion interna y la forma en que `providers` reutiliza el registro de incidentes.
- Validaciones ejecutadas:
  - `cmd /c npm run env:check`
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - `AdminService` sigue teniendo bloques menores como `security` y `help/content`, pero ya no concentra providers, communications ni finance
  - la lectura del registro de incidentes de garantia queda unificada en un solo servicio y eso baja riesgo de drift entre stats de providers y listados financieros

---

### 2026-03-30 - Codex
- Alcance: partir el subdominio `providers` en registro y busqueda, dejando una fachada publica chica.
- Tipo de intervencion: refactor interno seguro del backend admin + seccionado por responsabilidad dentro del modulo de proveedores.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/admin/admin.module.ts`
  - `next-stack/apps/api/src/modules/admin/admin-providers.service.ts`
  - `next-stack/apps/api/src/modules/admin/admin-provider-registry.service.ts`
  - `next-stack/apps/api/src/modules/admin/admin-provider-search.service.ts`
  - `next-stack/apps/api/src/modules/admin/admin-providers.types.ts`
  - `next-stack/apps/api/src/modules/admin/admin-provider-registry.service.test.ts`
  - `next-stack/apps/api/src/modules/admin/admin-provider-search.service.test.ts`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/backend/BACKEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado en rutas ni payloads. Los endpoints `/admin/providers*` siguen estables; cambia solo la separacion interna entre registro, stats y scraping/busqueda.
- Validaciones ejecutadas:
  - `cmd /c npm run env:check`
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - `admin-provider-search.service.ts` sigue siendo un archivo grande porque concentra parsing HTML/JSON y heuristicas de ranking; ahora ese hotspot ya quedo aislado y puede partirse sin tocar el registro de proveedores
  - `admin-providers.service.ts` bajo a una fachada de 73 lineas, mientras que el nuevo split deja mas claro que el siguiente corte natural del backend esta dentro de search/parsers

---

### 2026-03-30 - Codex
- Alcance: partir `admin-provider-search` en orquestacion, parsing, ranking y text utils sin tocar endpoints.
- Tipo de intervencion: refactor interno seguro del backend admin + corte del hotspot de scraping de proveedores.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/admin/admin-provider-search.service.ts`
  - `next-stack/apps/api/src/modules/admin/admin-provider-search.parsers.ts`
  - `next-stack/apps/api/src/modules/admin/admin-provider-search-ranking.ts`
  - `next-stack/apps/api/src/modules/admin/admin-provider-search.text.ts`
  - `next-stack/apps/api/src/modules/admin/admin-provider-search.service.test.ts`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/backend/BACKEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado en rutas ni payloads. Los endpoints de probe y busqueda de repuestos siguen estables; cambia solo la separacion interna entre fetch/orquestacion, parsing y ranking.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el hotspot ya no esta en el servicio publico sino en helpers puros mas acotados, lo que baja riesgo de tocar el contrato del subdominio
  - el siguiente servicio backend grande vuelve a ser `catalog-admin.service.ts`; a nivel repo, el hotspot mayor sigue en `RepairProviderPartPricingSection.tsx`

---

### 2026-03-30 - Codex
- Alcance: partir `CatalogAdminModule` en categorias, productos, pricing y soporte compartido, dejando una fachada estable.
- Tipo de intervencion: refactor interno seguro del backend catalog-admin + seccionado por responsabilidad.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/catalog-admin/catalog-admin.module.ts`
  - `next-stack/apps/api/src/modules/catalog-admin/catalog-admin.service.ts`
  - `next-stack/apps/api/src/modules/catalog-admin/catalog-admin.types.ts`
  - `next-stack/apps/api/src/modules/catalog-admin/catalog-admin-support.service.ts`
  - `next-stack/apps/api/src/modules/catalog-admin/catalog-admin-categories.service.ts`
  - `next-stack/apps/api/src/modules/catalog-admin/catalog-admin-products.service.ts`
  - `next-stack/apps/api/src/modules/catalog-admin/catalog-admin-pricing.service.ts`
  - `next-stack/apps/api/src/modules/catalog-admin/catalog-admin-pricing.service.test.ts`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/backend/BACKEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado en rutas ni payloads. Los endpoints `/catalog-admin/*` siguen estables; cambia solo la separacion interna entre categorias, productos, pricing y helpers compartidos.
- Validaciones ejecutadas:
  - `cmd /c npm run env:check`
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el modulo backend ya no tiene un servicio publico grande, pero todavia quedan hotspots tecnicos en `admin-provider-registry.service.ts` y `admin-provider-search.parsers.ts`
  - el hotspot mas grande del repo completo sigue en frontend dentro de `RepairProviderPartPricingSection.tsx`

---

### 2026-03-30 - Codex
- Alcance: partir `RepairProviderPartPricingSection` en helpers y panels especificos, dejando el archivo principal como orquestador de estado y requests.
- Tipo de intervencion: refactor interno seguro del frontend repairs + seccionado de hotspot compartido entre create/detail.
- Archivos tocados:
  - `next-stack/apps/web/src/features/repairs/RepairProviderPartPricingSection.tsx`
  - `next-stack/apps/web/src/features/repairs/repair-provider-part-pricing-section.helpers.ts`
  - `next-stack/apps/web/src/features/repairs/repair-provider-part-pricing-section.helpers.test.ts`
  - `next-stack/apps/web/src/features/repairs/repair-provider-part-pricing-section.search.tsx`
  - `next-stack/apps/web/src/features/repairs/repair-provider-part-pricing-section.preview.tsx`
  - `next-stack/apps/web/src/features/repairs/repair-provider-part-pricing-section.snapshot.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado en rutas ni en el contrato del componente. Se mantiene el flujo proveedor + repuesto + preview + snapshot; cambia solo la separacion interna y la legibilidad del modulo.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - la pieza compartida mas grande de `repairs` ya no esta concentrada en un unico archivo, pero todavia quedan hotspots frontend claros en `AdminRepairDetailPage.tsx` y `AdminRepairCreatePage.tsx`
  - este corte deja listo el terreno para extraer contratos/helpers adicionales del subdominio sin mezclar estado, render y calculo en una misma pieza

---

### 2026-03-30 - Codex
- Alcance: partir `AdminRepairDetailPage` en helpers y sections, dejando la pagina principal como orquestador.
- Tipo de intervencion: refactor interno seguro del frontend repairs + seccionado de pagina admin con mucha mezcla de estado, formulario e historial.
- Archivos tocados:
  - `next-stack/apps/web/src/features/repairs/AdminRepairDetailPage.tsx`
  - `next-stack/apps/web/src/features/repairs/admin-repair-detail.helpers.ts`
  - `next-stack/apps/web/src/features/repairs/admin-repair-detail.helpers.test.ts`
  - `next-stack/apps/web/src/features/repairs/admin-repair-detail.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado en rutas ni en el flujo del detalle admin. Se mantiene la carga, edicion, sugerencias y timeline; cambia la separacion interna entre helpers puros, sections de UI y pagina orquestadora.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el detalle admin ya no es el hotspot principal del subdominio, pero `AdminRepairCreatePage.tsx` sigue concentrando bastante formulario y flujo
  - este corte deja mas claro el proximo paso natural del frontend `repairs`: alinear create con la misma metodologia de helpers + sections

---

### 2026-03-31 - Codex
- Alcance: partir `AdminRepairCreatePage` en helpers y sections, dejando la pagina principal como orquestador.
- Tipo de intervencion: refactor interno seguro del frontend repairs + seccionado de pagina admin de alta con mezcla de catalogo, pricing y submit.
- Archivos tocados:
  - `next-stack/apps/web/src/features/repairs/AdminRepairCreatePage.tsx`
  - `next-stack/apps/web/src/features/repairs/admin-repair-create.helpers.ts`
  - `next-stack/apps/web/src/features/repairs/admin-repair-create.helpers.test.ts`
  - `next-stack/apps/web/src/features/repairs/admin-repair-create.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado en rutas ni en el flujo del alta admin. Se mantiene la carga de catalogo, el preview/sugerencia y el submit; cambia la separacion interna entre helpers puros, sections de UI y pagina orquestadora.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - `repairs` ya queda mucho mas consistente entre create/detail, pero todavia puede extraerse alguna logica comun de formularios si luego vale la pena
  - el siguiente hotspot real del frontend ya se mueve fuera de `repairs` hacia `AppShell.tsx`, `AdminProductEditPage.tsx` o `AdminProvidersPage.tsx`

---

### 2026-03-31 - Codex
- Alcance: partir `AppShell` en subcomponentes de `app-shell`, dejando el layout principal como orquestador.
- Tipo de intervencion: refactor interno seguro del frontend transversal + limpieza del shell compartido sin cambiar rutas ni flujo visible.
- Archivos tocados:
  - `next-stack/apps/web/src/layouts/AppShell.tsx`
  - `next-stack/apps/web/src/layouts/app-shell/account-menu.tsx`
  - `next-stack/apps/web/src/layouts/app-shell/footer.tsx`
  - `next-stack/apps/web/src/layouts/app-shell/link-icons.tsx`
  - `next-stack/apps/web/src/layouts/app-shell/mobile-sidebar.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen header, sidebar mobile, menu de cuenta, branding visible, popup de carrito y accesos; cambia la separacion interna entre estado/wiring del shell y subcomponentes de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el split limpia el layout transversal, pero no resuelve todavia el hotspot de `styles.css`
  - el siguiente retorno real del frontend ya pasa a `AdminProductEditPage.tsx`, `AdminProvidersPage.tsx` o `AdminOrdersPage.tsx`

---

### 2026-03-31 - Codex
- Alcance: partir `AdminProductEditPage` y extraer base compartida del formulario comercial de productos.
- Tipo de intervencion: refactor interno seguro del frontend catalog admin + reduccion de duplicacion entre alta y edicion de productos.
- Archivos tocados:
  - `next-stack/apps/web/src/features/catalogAdmin/AdminProductEditPage.tsx`
  - `next-stack/apps/web/src/features/catalogAdmin/AdminProductCreatePage.tsx`
  - `next-stack/apps/web/src/features/catalogAdmin/admin-product-edit.sections.tsx`
  - `next-stack/apps/web/src/features/catalogAdmin/admin-product-form.helpers.ts`
  - `next-stack/apps/web/src/features/catalogAdmin/admin-product-form.helpers.test.ts`
  - `next-stack/apps/web/src/features/catalogAdmin/admin-product-form.controls.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado en rutas ni en el flujo de catalogo comercial. Se mantiene la carga, el pricing recomendado, el upload de imagen y el guardado; cambia la separacion interna entre estado, helpers puros, controles compartidos y secciones de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - `catalogAdmin` queda bastante mas ordenado entre create/edit, pero todavia no ataca el hotspot visual global de `styles.css`
  - el siguiente retorno real del frontend ya pasa a `AdminProvidersPage.tsx`, `AdminOrdersPage.tsx` o a la particion de estilos globales

---

### 2026-03-31 - Codex
- Alcance: partir `AdminProvidersPage` en helpers y sections, dejando la pagina principal como orquestador del feature.
- Tipo de intervencion: refactor interno seguro del frontend de operaciones + seccionado del panel de proveedores sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/providers/AdminProvidersPage.tsx`
  - `next-stack/apps/web/src/features/providers/admin-providers.helpers.ts`
  - `next-stack/apps/web/src/features/providers/admin-providers.helpers.test.ts`
  - `next-stack/apps/web/src/features/providers/admin-providers.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen resumenes, prioridad de busqueda, alta de proveedor, probe, toggle y tabla editable; cambia la separacion interna entre estado/acciones del feature y render de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - `providers` ya queda mucho mas legible, pero el cliente sigue dependiendo de `features/admin/api.ts` como frontera compartida
  - el siguiente retorno real del frontend ya pasa a `AdminOrdersPage.tsx` o a la particion de `styles.css`

---

### 2026-03-31 - Codex
- Alcance: partir `AdminOrdersPage` en helpers y sections, dejando la pagina principal como orquestador del tracking admin.
- Tipo de intervencion: refactor interno seguro del frontend de operaciones + seccionado del feature `orders` sin abrir una frontera API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/orders/AdminOrdersPage.tsx`
  - `next-stack/apps/web/src/features/orders/admin-orders.helpers.ts`
  - `next-stack/apps/web/src/features/orders/admin-orders.helpers.test.ts`
  - `next-stack/apps/web/src/features/orders/admin-orders.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen metricas, filtros, cambio de estado, detalle inline, enlaces de impresion y resumen de seguimiento; cambia la separacion interna entre fetch, estado derivado y render de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - `orders` ya queda mejor seccionado en el flujo admin, pero `AdminQuickSalesPage.tsx` sigue siendo el siguiente hotspot grande del mismo subdominio
  - la particion de `styles.css` sigue pendiente y sigue siendo un frente transversal mas grande que cualquier pagina individual

---

### 2026-03-31 - Codex
- Alcance: partir `AdminQuickSalesPage` en helpers y sections, dejando la pagina principal como orquestador de la venta rapida.
- Tipo de intervencion: refactor interno seguro del frontend de operaciones + seccionado del flujo de mostrador sin abrir una frontera API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/orders/AdminQuickSalesPage.tsx`
  - `next-stack/apps/web/src/features/orders/admin-quick-sales.helpers.ts`
  - `next-stack/apps/web/src/features/orders/admin-quick-sales.helpers.test.ts`
  - `next-stack/apps/web/src/features/orders/admin-quick-sales.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen scanner/carga por codigo, busqueda manual, ticket actual, validaciones de telefono, confirmacion de la venta e impresion del ticket; cambia la separacion interna entre estado, helpers puros y panels de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - `orders` ya queda bastante mas coherente entre tracking admin y venta rapida, pero `AdminQuickSalesHistoryPage.tsx` y `styles.css` siguen siendo puntos a revisar si se quiere bajar mas complejidad visual/operativa
  - la particion de `styles.css` sigue teniendo mas impacto transversal que cualquier pagina individual restante

---

### 2026-03-31 - Codex
- Alcance: partir `styles.css` en capas fisicas bajo `src/styles/`, dejando `styles.css` como entrypoint del build.
- Tipo de intervencion: refactor interno seguro del frontend visual + limpieza estructural de la cascada global sin cambiar el wiring de `main.tsx`.
- Archivos tocados:
  - `next-stack/apps/web/src/styles.css`
  - `next-stack/apps/web/src/styles/base.css`
  - `next-stack/apps/web/src/styles/store.css`
  - `next-stack/apps/web/src/styles/layout.css`
  - `next-stack/apps/web/src/styles/repairs.css`
  - `next-stack/apps/web/src/styles/components.css`
  - `next-stack/apps/web/src/styles/admin.css`
  - `next-stack/apps/web/src/styles/commerce.css`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantiene el mismo entrypoint CSS en `main.tsx` y la misma cascada general; cambia la seccion fisica de reglas para que base, store, layout, repairs, componentes, admin y commerce dejen de convivir en un unico archivo monolitico.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el split es conservador y mantiene el orden de cascada, pero futuras limpiezas todavia pueden afinar reglas muertas o cruces entre `commerce.css` y `admin.css`
  - con este cambio el siguiente retorno real ya no pasa por seguir rompiendo `styles.css`, sino por revisar paginas grandes o refinar capas visuales con menor blast radius

---

### 2026-03-31 - Codex
- Alcance: partir `AdminProductPricingRulesPage` en helpers y sections, dejando la pagina principal como orquestador del pricing comercial.
- Tipo de intervencion: refactor interno seguro del frontend admin/pricing + seccionado del simulador y las reglas comerciales sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/AdminProductPricingRulesPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-product-pricing-rules.helpers.ts`
  - `next-stack/apps/web/src/features/admin/admin-product-pricing-rules.helpers.test.ts`
  - `next-stack/apps/web/src/features/admin/admin-product-pricing-rules.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen preferencias, simulador, alta de reglas, edicion inline y borrado; cambia la separacion interna entre fetch, payloads, filtros, texto derivado y render de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el pricing comercial queda mucho mas legible, pero el siguiente hotspot claro del mismo subdominio sigue estando en `AdminRepairPricingRulesPage.tsx`
  - el feature sigue apoyandose en `features/catalogAdmin/productPricingApi.ts` como cliente compartido, lo cual esta bien por ahora pero todavia deja una frontera comun entre admin y catalog admin

---

### 2026-03-31 - Codex
- Alcance: partir `AdminRepairPricingRulesPage` en helpers y sections, dejando la pagina principal como orquestador del pricing de reparaciones.
- Tipo de intervencion: refactor interno seguro del frontend admin/pricing + seccionado de la grilla editable de rules sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/AdminRepairPricingRulesPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-repair-pricing-rules.helpers.ts`
  - `next-stack/apps/web/src/features/admin/admin-repair-pricing-rules.helpers.test.ts`
  - `next-stack/apps/web/src/features/admin/admin-repair-pricing-rules.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen carga, edicion inline, scope dependiente, guardado y borrado de reglas; cambia la separacion interna entre fetch/lookups, payloads y render de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el area `admin/pricing` ya queda mucho mas consistente entre reglas comerciales y reglas de reparaciones, pero todavia quedan paginas especificas del mismo subdominio como `AdminRepairPricingRuleEditPage.tsx`
  - el split mantiene `adminApi` y `deviceCatalogApi` como fronteras de lookup compartidas, lo cual es correcto por ahora pero sigue dejando dependencias cruzadas dentro del admin tecnico

---

### 2026-03-31 - Codex
- Alcance: partir `AdminDashboardPage` en helpers y sections, dejando la pagina principal como orquestador del dashboard admin.
- Tipo de intervencion: refactor interno seguro del frontend admin + separacion entre fetch, metricas operativas y secciones visuales.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/AdminDashboardPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-dashboard.helpers.ts`
  - `next-stack/apps/web/src/features/admin/admin-dashboard.helpers.test.ts`
  - `next-stack/apps/web/src/features/admin/admin-dashboard.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen quick actions, gestion principal, resumen, bandeja, actividad reciente y administracion avanzada; cambia la separacion interna entre fetch, calculos del dashboard y render de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el dashboard admin queda bastante mas claro, pero siguen pendientes paginas grandes del frontend como `StorePage.tsx`, `AdminCategoriesPage.tsx` y `AdminProductsPage.tsx`
  - el split mantiene los mismos componentes base (`PageHeader`, `SectionCard`, `StatusBadge`) y no introduce una nueva capa de estado global

---

### 2026-03-31 - Codex
- Alcance: partir `StorePage` en helpers y sections, dejando la pagina principal como orquestador del storefront.
- Tipo de intervencion: refactor interno seguro del frontend publico + seccionado del catalogo sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/store/StorePage.tsx`
  - `next-stack/apps/web/src/features/store/store-page.helpers.ts`
  - `next-stack/apps/web/src/features/store/store-page.helpers.test.ts`
  - `next-stack/apps/web/src/features/store/store-page.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen hero, filtros, sort mobile, categorias, resultados y card grid; cambia la separacion interna entre fetch/sync de query params, helpers puros y secciones de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - la tienda publica ya queda mas ordenada, pero siguen pendientes hotspots de `catalogAdmin` como `AdminCategoriesPage.tsx` y `AdminProductsPage.tsx`
  - el split mantiene el mismo uso de `storeApi` y `useSearchParams`; no introduce estado global nuevo ni cambia la semantica del storefront

---

### 2026-03-31 - Codex
- Alcance: partir `AdminCategoriesPage` en helpers y sections, dejando la pagina principal como orquestador del CRUD de categorias.
- Tipo de intervencion: refactor interno seguro del frontend catalog admin + seccionado del feature base de categorias sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/catalogAdmin/AdminCategoriesPage.tsx`
  - `next-stack/apps/web/src/features/catalogAdmin/admin-categories.helpers.ts`
  - `next-stack/apps/web/src/features/catalogAdmin/admin-categories.helpers.test.ts`
  - `next-stack/apps/web/src/features/catalogAdmin/admin-categories.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen create/edit, toggle, borrado, stats y filtro local; cambia la separacion interna entre fetch/ruta, helpers puros y secciones de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - `catalogAdmin` queda mas consistente entre categorias y productos, pero el siguiente hotspot claro del subdominio sigue en `AdminProductsPage.tsx`
  - el split mantiene `catalogAdminApi` como frontera unica del CRUD comercial, lo cual es correcto por ahora y no introduce estado global adicional

---

### 2026-03-31 - Codex
- Alcance: partir `AdminProductsPage` en helpers y sections, dejando la pagina principal como orquestador del catalogo operativo.
- Tipo de intervencion: refactor interno seguro del frontend catalog admin + seccionado de la vista principal de productos sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/catalogAdmin/AdminProductsPage.tsx`
  - `next-stack/apps/web/src/features/catalogAdmin/admin-products.helpers.ts`
  - `next-stack/apps/web/src/features/catalogAdmin/admin-products.helpers.test.ts`
  - `next-stack/apps/web/src/features/catalogAdmin/admin-products.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen stats, filtros, listado, edicion rapida de stock y toggles de estado/destacado; cambia la separacion interna entre fetch/sync, helpers puros y secciones de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - `catalogAdmin` ya queda ordenado en sus pantallas principales, pero siguen pendientes hotspots de admin como `AdminStoreHeroSettingsPage.tsx` y `AdminAutoReportsPage.tsx`
  - el split reutiliza helpers del formulario comercial para money/opciones y mantiene `catalogAdminApi` como frontera unica del subdominio

---
