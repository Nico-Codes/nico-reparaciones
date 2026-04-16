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

### [DL-0107]
- Fecha: 2026-04-16
- Estado: aceptada
- Tema: agregar Sign in with Apple para cuentas cliente sin abrir un modelo generico de identidades sociales
- Contexto: el login web ya habia incorporado Google solo para `USER`, con redirect OAuth resuelto en backend, callback frontend y canje de un `result token` corto antes de persistir sesion. El siguiente pedido fue sumar Apple manteniendo el mismo criterio de seguridad y sin abrir un refactor mayor de auth social.
- Decision: agregar `appleSubject` en `User` y montar `Sign in with Apple` en paralelo al flujo de Google. El backend expone discovery publico de providers (`/api/auth/social/providers`) y nuevos endpoints `start/callback/complete` para Apple, aceptando `form_post` como camino principal. La vinculacion se mantiene limitada a `USER`: si el email coincide con un usuario existente se enlaza, si coincide con `ADMIN` se rechaza, y si no existe se crea una cuenta cliente nueva con `passwordHash = null` y email verificado. Si Apple no devuelve email en el primer acceso y no existe `appleSubject` previo, el login falla explicitamente.
- Impacto: login puede mostrar Google y Apple solo cuando el backend los tiene realmente configurados. Se preserva el flujo local y 2FA admin sin cambios, y se evita introducir un modelo `socialIdentities` mas amplio antes de que haga falta.
- Alternativas consideradas: generalizar de inmediato a un sistema abstracto de proveedores sociales o permitir Apple tambien para `ADMIN`; descartado por mayor superficie de cambio, mas riesgo en auth y por no alinearse con el alcance pedido.
- Archivos / modulos afectados: `next-stack/apps/api/src/modules/auth/*`, `next-stack/apps/api/prisma/{schema.prisma,migrations/*}`, `next-stack/apps/api/src/main.ts`, `next-stack/packages/contracts/src/index.ts`, `next-stack/apps/web/src/features/auth/*`, `next-stack/apps/web/src/{App.tsx,app/routing/route-pages.tsx}`, `next-stack/.env*.example`, `project-docs/{backend/BACKEND_MAP.md,frontend/FRONTEND_MAP.md}`, `CHANGELOG_AI.md`.
- Validacion requerida: `db:generate --workspace @nico/api`, `db:migrate --workspace @nico/api`, `typecheck --workspace @nico/api`, `test --workspace @nico/api`, `build --workspace @nico/api`, `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:backend`, `smoke:web`, `git diff --check`.
- Responsable: Codex + operador humano

---

### [DL-0106]
- Fecha: 2026-04-14
- Estado: aceptada
- Tema: centralizar catalogo tecnico + pricing de reparaciones en una hub unica y volver explicita la marca activa para crear modelos
- Contexto: la gestion del subdominio de reparaciones estaba repartida entre catalogo de dispositivos, grupos de modelos, tipos de reparacion y reglas de precio. Eso volvia dificil entender el arbol real (`Tipo -> Marca -> Grupo -> Modelo`, `Falla por Tipo`) y dejaba demasiado implicito como se cargaban modelos dentro de una marca.
- Decision: crear una entrada unica en `/admin/calculos/reparaciones` que hidrate tipos, marcas, grupos, modelos, fallas y reglas con el mismo contexto de scope. Las vistas historicas se mantienen como editores especificos, pero pasan a leer query string para prehidratar contexto desde la hub. Ademas, tanto la hub como `AdminDevicesCatalogPage.tsx` dejan visible una `marca activa` y la usan explicitamente para crear modelos, evitando depender de una seleccion separada y poco obvia.
- Impacto: el operador puede entender y operar el arbol tecnico desde una sola pantalla, con deep links a editores puntuales cuando hace falta. El flujo para agregar un modelo a una marca deja de ser ambiguo porque ahora la marca de trabajo se ve, se selecciona desde la propia lista y se mantiene como contexto visible.
- Alternativas consideradas: seguir con pantallas separadas y solo mejorar copy puntual, o mover toda la logica a un backend agregado nuevo; descartado por mantener la confusion operativa o por abrir complejidad innecesaria sin cambiar reglas de negocio.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/{AdminRepairCalculationsHubPage.tsx,admin-repair-calculation-context.ts,admin-repair-calculations-hub.sections.tsx,AdminCalculationsHubPage.tsx,AdminDevicesCatalogPage.tsx,admin-devices-catalog.*,AdminModelGroupsPage.tsx,AdminRepairTypesPage.tsx,AdminRepairPricingRulesPage.tsx,AdminRepairPricingRuleCreatePage.tsx,AdminRepairPricingRuleEditPage.tsx}`, `next-stack/apps/api/src/modules/admin/{admin.controller.ts,admin.service.ts}`, `next-stack/apps/web/src/features/{admin,deviceCatalog}/api.ts`, `project-docs/{frontend/FRONTEND_MAP.md,backend/BACKEND_MAP.md,architecture/ARCHITECTURE.md}`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/api`, `test --workspace @nico/api`, `build --workspace @nico/api`, `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `git diff --check`.
- Responsable: Codex + operador humano

---

### [DL-0105]
- Fecha: 2026-04-14
- Estado: aceptada
- Tema: reintroducir login con Google solo para cuentas cliente usando redirect OAuth y vinculacion por email
- Contexto: el stack actual habia quedado sin auth social y el login web solo aceptaba email + contrasena. El pedido fue agregar Google sin abrir un sistema paralelo ni debilitar el acceso admin, manteniendo la UI social solo en login.
- Decision: agregar flujo OAuth por redirect resuelto principalmente en backend (`/api/auth/google/start`, `/api/auth/google/callback`, `/api/auth/google/complete`), sin SDK web de Google ni Passport por defecto. El alcance queda limitado a cuentas `USER`: si Google devuelve un email ya existente de usuario, se vincula por email; si el email corresponde a `ADMIN`, el acceso social se rechaza. El callback del backend no entrega tokens finales por query string: redirige al frontend con un `result token` corto y firmado, y el frontend lo canjea por el `AuthResponse` normal antes de persistir sesion.
- Impacto: clientes pueden entrar con Google desde `LoginPage` sin romper el flujo local existente. `register` sigue publico, pero el alta social queda absorbida por login. El modelo `User` incorpora `googleSubject` como identificador social persistente y las cuentas Google se marcan verificadas cuando Google entrega `email_verified=true`.
- Alternativas consideradas: permitir Google tambien para `ADMIN`, usar popup/SDK web o reinstalar auth social mas amplio en varias pantallas; descartado por complejidad mayor, mayor superficie de riesgo y por no respetar el alcance pedido.
- Archivos / modulos afectados: `next-stack/apps/api/src/modules/auth/*`, `next-stack/apps/api/prisma/*`, `next-stack/packages/contracts/src/index.ts`, `next-stack/apps/web/src/features/auth/*`, `next-stack/apps/web/src/App.tsx`, `next-stack/apps/web/src/app/routing/route-pages.tsx`, `project-docs/{architecture/ARCHITECTURE.md,frontend/FRONTEND_MAP.md,backend/BACKEND_MAP.md}`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/api`, `test --workspace @nico/api`, `build --workspace @nico/api`, `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `git diff --check`.
- Responsable: Codex + operador humano

---

### [DL-0104]
- Fecha: 2026-04-14
- Estado: aceptada
- Tema: tratar el panel visual de auth como imagen real de branding y no como ilustracion CSS generada
- Contexto: despues de separar el fondo visual del login en variantes `desktop/mobile`, la implementacion seguia renderizando blobs, waves y shapes decorativos dentro de `AuthLayout` y `auth.css`. Eso dejaba el panel izquierdo como una ilustracion compuesta por CSS, no como el asset real editable pedido para identidad visual.
- Decision: simplificar `auth-visual` para que renderice solo tres capas: imagen real de branding (`desktop/mobile` con fallback), overlay suave de contraste y `auth-visual__content`. Se eliminan del markup y del stylesheet todos los `auth-visual__shape*`, la ola blanca inferior y la composicion decorativa basada en gradientes. La navbar de auth mantiene la misma estructura visual del shell publico real.
- Impacto: el fondo del login pasa a comportarse igual que los demas assets administrables de la web. Cambiar la imagen desde identidad visual modifica directamente el panel izquierdo sin depender de formas dibujadas en CSS. El responsive mobile queda mas compacto porque la banda visual superior deja de cargar decoracion adicional.
- Alternativas consideradas: mantener las variantes desktop/mobile pero seguir enriqueciendo el panel con formas CSS o esconder por completo el bloque visual en mobile; descartado por seguir rompiendo el criterio de "imagen real editable" y por perder consistencia visual del acceso.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/auth/AuthLayout.tsx`, `next-stack/apps/web/src/styles/auth.css`, `project-docs/architecture/{ARCHITECTURE.md,ASSET_STRATEGY.md}`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/api`, `test --workspace @nico/api`, `build --workspace @nico/api`, `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `git diff --check`.
- Responsable: Codex + operador humano

---

### [DL-0103]
- Fecha: 2026-04-13
- Estado: aceptada
- Tema: alinear el header de auth con la navbar real del sitio y separar el fondo visual del login en variantes desktop/mobile
- Contexto: el primer rediseño de auth habia mejorado la escena visual, pero el header seguia usando una gramática distinta a `AppShell`, lo que generaba inconsistencia en desktop y una experiencia mobile pobre en login. Ademas, el fondo izquierdo del acceso tenia una sola variante editable, insuficiente para responsive real.
- Decision: rehacer `AuthLayout` para reutilizar la misma estructura visual del shell general (`shell-header`, nav pill desktop, burger + `MobileSidebar`), manteniendo solo la regla de ocultar el CTA redundante de login en `/auth/login`. En branding, mantener el fondo actual como variante desktop y agregar una variante mobile independiente bajo el mismo circuito de `AdminBrandAssetsService` + `/api/store/branding`.
- Impacto: auth deja de parecer una superficie separada del sitio y pasa a verse alineado al resto de la web. El login puede usar una imagen optimizada para desktop y otra para mobile sin introducir configuraciones paralelas.
- Alternativas consideradas: mantener un header propio de auth con styling parecido o reutilizar una sola imagen del login en todos los breakpoints; descartado por seguir dejando diferencias visuales con la navbar real y por limitar el control responsive del branding.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/auth/AuthLayout.tsx`, `next-stack/apps/web/src/layouts/app-shell/mobile-sidebar.tsx`, `next-stack/apps/web/src/styles/auth.css`, `next-stack/apps/api/src/modules/{admin,store}/*`, `next-stack/apps/web/src/features/admin/admin-visual-identity.*`, `project-docs/architecture/{ARCHITECTURE.md,ASSET_STRATEGY.md}`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/api`, `test --workspace @nico/api`, `build --workspace @nico/api`, `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `git diff --check`.
- Responsable: Codex + operador humano

---

### [DL-0102]
- Fecha: 2026-04-13
- Estado: aceptada
- Tema: tratar el fondo visual del login como asset administrable de branding y compactar el acceso para evitar scroll en desktop
- Contexto: el shell de auth ya habia ganado una escena propia, pero el panel izquierdo seguia dependiendo solo de gradientes fijos en codigo y el login seguia quedando largo en pantallas desktop medianas. Eso rompia dos criterios: el branding visual no era editable desde admin y la vista principal de acceso no entraba completa con comodidad.
- Decision: agregar `brand_asset.auth_login_background.path` al circuito canonico de branding, administrarlo desde `AdminVisualIdentityPage`, exponerlo en `GET /api/store/branding` y consumirlo en `AuthLayout` como fondo del panel visual izquierdo con overlay seguro. Al mismo tiempo, reducir la altura efectiva del flujo de login unificando el CTA de registro dentro de la misma tarjeta y compactando spacing del shell de auth.
- Impacto: el fondo del login deja de ser una decision hardcodeada del frontend y pasa a gestionarse igual que hero, logos e iconos. El acceso principal entra mejor en desktop y mantiene la politica de recomendar registro solo desde login.
- Alternativas consideradas: dejar el fondo del login embebido en CSS o crear un endpoint/configuracion paralela solo para auth; descartado por duplicar fuentes de verdad y por complicar el mantenimiento del branding.
- Archivos / modulos afectados: `next-stack/apps/api/src/modules/{admin,store}/*`, `next-stack/apps/web/src/features/{auth,admin,store}/*`, `next-stack/apps/web/src/styles/auth.css`, `project-docs/architecture/{ARCHITECTURE.md,ASSET_STRATEGY.md}`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/api`, `test --workspace @nico/api`, `build --workspace @nico/api`, `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `git diff --check`.
- Responsable: Codex + operador humano

---

### [DL-0099]
- Fecha: 2026-04-13
- Estado: aceptada
- Tema: dar por cerrada la segunda ola de refinamiento del frontend cuando los wrappers queden como fronteras y no como hotspots
- Contexto: despues del seccionado principal, ya no quedaban paginas grandes sin partir, pero seguian varios `sections.tsx` y un hook de `repairs` mezclando demasiadas responsabilidades internas. El riesgo era seguir rompiendo por tamaño de archivo sin una regla clara de cierre.
- Decision: cerrar la segunda ola cuando los wrappers publicos (`sections.tsx` y hooks orquestadores) queden reducidos a composicion y deleguen la logica o la UI densa a panels, rows o hooks especializados. Se aplico ese criterio en `orders`, `repairs`, `providers`, `dashboard`, `catalogAdmin`, `admin/pricing` y `hero settings`.
- Impacto: el frontend queda mucho mas consistente: paginas -> helpers + sections; sections -> panels/rows; hooks densos -> hooks especializados. Lo que sigue grande ahora ya es complejidad terminal del dominio y no deuda evidente de seccionado.
- Alternativas consideradas: seguir partiendo indefinidamente cualquier archivo largo o cortar la ola antes de tiempo; descartado por generar una limpieza sin criterio de cierre o dejar wrappers aun demasiado cargados.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/{orders,repairs,providers,admin,catalogAdmin}/*`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/architecture/ARCHITECTURE.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
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

### [DL-0071]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminStoreHeroSettingsPage` pasa a orquestador y la portada de tienda gana helpers + sections propios
- Contexto: despues de ordenar `catalogAdmin`, el siguiente hotspot claro del admin visual quedo en `AdminStoreHeroSettingsPage.tsx`. La pagina mezclaba metadata de assets, hydrate/save de settings, conversion RGB/HEX, upload/reset de imagenes, preview y formulario visual en un solo archivo con textos dañados por mojibake.
- Decision: mantener la ruta y el wiring con `adminSettingsApi` y `brandAssetsApi` estables, pero mover metadata, payloads y conversiones a `admin-store-hero-settings.helpers.ts`, mover las cards de upload, alertas, header y formulario visual a `admin-store-hero-settings.sections.tsx`, y dejar `AdminStoreHeroSettingsPage.tsx` como orquestador de fetch, sync, save y mutaciones de assets. Tambien se agrega test unitario para helpers del feature.
- Impacto: `AdminStoreHeroSettingsPage.tsx` baja de forma marcada, el area visual del admin gana una frontera clara entre datos y UI, y la pagina deja de concentrar conversion de color, metadata y preview en el mismo archivo. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo las cards de imagen o saltar primero a `AdminAutoReportsPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en la configuracion visual mas cargada del admin y permitia corregir a la vez los textos dañados del feature.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/{AdminStoreHeroSettingsPage.tsx,admin-store-hero-settings.helpers.ts,admin-store-hero-settings.helpers.test.ts,admin-store-hero-settings.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0072]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminAutoReportsPage` pasa a orquestador y el feature de reportes gana helpers + sections propios
- Contexto: despues de ordenar `AdminStoreHeroSettingsPage`, el siguiente hotspot claro del admin general quedo en `AdminAutoReportsPage.tsx`. La pagina mezclaba defaults, carga de settings, payloads de guardado, historial operativo, status/meta de ejecucion, envios manuales y todo el render del formulario en un solo archivo.
- Decision: mantener la ruta y el wiring con `adminSettingsApi` y `adminApi` estables, pero mover constantes, defaults, normalizacion del anti-spam, payloads e historial derivado a `admin-auto-reports.helpers.ts`, mover header, feedback, formulario e historial a `admin-auto-reports.sections.tsx`, y dejar `AdminAutoReportsPage.tsx` como orquestador de fetch, save y acciones manuales. Tambien se agrega test unitario para helpers del feature.
- Impacto: `AdminAutoReportsPage.tsx` baja de forma marcada, el admin general gana una frontera mas clara entre settings/reporting y UI, y el feature deja de concentrar estado derivado, parsing de summary y payloads en el mismo archivo. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo el bloque del historial o saltar primero a `AdminVisualIdentityPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en el feature de reportes, que mezclaba mejor que ninguno datos, formulario y acciones manuales.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/{AdminAutoReportsPage.tsx,admin-auto-reports.helpers.ts,admin-auto-reports.helpers.test.ts,admin-auto-reports.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0073]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminVisualIdentityPage` pasa a orquestador y el admin visual gana helpers + sections propios
- Contexto: despues de ordenar la portada y los reportes automaticos, el siguiente hotspot claro del admin visual quedo en `AdminVisualIdentityPage.tsx`. La pagina mezclaba metadata de favicons/iconos/logos, resolucion de settings y paths, preview visual, object URLs temporales y cards de upload en un solo archivo con varios textos dañados.
- Decision: mantener la ruta y el wiring con `adminSettingsApi` y `brandAssetsApi` estables, pero mover metadata, accept list y resolucion de paths a `admin-visual-identity.helpers.ts`, mover header, alerts, sections, cards y previews a `admin-visual-identity.sections.tsx`, y dejar `AdminVisualIdentityPage.tsx` como orquestador de fetch, upload/reset y seleccion por slot. Tambien se agrega test unitario para helpers del feature.
- Impacto: `AdminVisualIdentityPage.tsx` baja de forma marcada, el subdominio visual queda mas consistente con `AdminStoreHeroSettingsPage`, y ademas el preview de archivos temporales ahora limpia correctamente sus `objectURL`. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo las cards de upload o saltar primero a otra pagina admin; descartado porque el mayor retorno inmediato seguia estando en la otra pagina visual grande del subdominio y convenia cerrarla con el mismo patron ya usado en assets/branding.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/{AdminVisualIdentityPage.tsx,admin-visual-identity.helpers.ts,admin-visual-identity.helpers.test.ts,admin-visual-identity.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0074]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminBusinessSettingsPage` pasa a orquestador y la configuracion base del negocio gana helpers + sections propios
- Contexto: despues de ordenar el admin visual, el siguiente hotspot claro del admin general quedo en `AdminBusinessSettingsPage.tsx`. La pagina mezclaba defaults, hydrate/save de settings, payloads de negocio, dirty detection, feedback, sidebar de resumen y acciones del formulario en un solo archivo.
- Decision: mantener la ruta y el wiring con `adminSettingsApi` estables, pero mover defaults, lectura de settings, payloads y dirty detection a `admin-business-settings.helpers.ts`, mover feedback, secciones principales, sidebar y acciones a `admin-business-settings.sections.tsx`, y dejar `AdminBusinessSettingsPage.tsx` como orquestador de fetch, sync, guardado y cancelacion. Tambien se agrega test unitario para helpers del feature.
- Impacto: `AdminBusinessSettingsPage.tsx` baja de forma marcada, la configuracion base del negocio gana una frontera clara entre datos y UI, y el admin general queda mas consistente con el patron de helpers + sections ya usado en branding, reportes y dashboard. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo el sidebar o saltar primero a `AdminWarrantyCreatePage.tsx`; descartado porque el mayor retorno inmediato seguia estando en la pagina de settings base que todavia mezclaba demasiado estado derivado con render.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/{AdminBusinessSettingsPage.tsx,admin-business-settings.helpers.ts,admin-business-settings.helpers.test.ts,admin-business-settings.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0075]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminWarrantyCreatePage` pasa a orquestador y el alta de garantias gana helpers + sections propios
- Contexto: despues de ordenar business settings, el siguiente hotspot claro del frontend operativo quedo en `AdminWarrantyCreatePage.tsx`. La pagina mezclaba defaults del formulario, lookups de reparacion/producto/proveedor, calculo de perdida, payload de guardado y render completo del alta en un solo archivo.
- Decision: mantener la ruta y el wiring con `adminApi`, `repairsApi` y `catalogAdminApi` estables, pero mover defaults, opciones, calculos y payloads a `admin-warranty-create.helpers.ts`, mover hero, feedback, secciones del formulario y acciones a `admin-warranty-create.sections.tsx`, y dejar `AdminWarrantyCreatePage.tsx` como orquestador de fetch, sync y submit. Tambien se agrega test unitario para helpers del feature.
- Impacto: `AdminWarrantyCreatePage.tsx` baja de forma marcada, el subdominio `warranties` gana una frontera clara entre datos y UI, y la pantalla deja de concentrar el armado de costo/perdida/payload junto con todo el render del formulario. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo la tarjeta de costos o saltar primero a `AdminDevicesCatalogPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en el alta de garantias, que mezclaba demasiada logica de negocio con render.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/warranties/{AdminWarrantyCreatePage.tsx,admin-warranty-create.helpers.ts,admin-warranty-create.helpers.test.ts,admin-warranty-create.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0076]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminDevicesCatalogPage` pasa a orquestador y el catalogo tecnico gana helpers + sections propios
- Contexto: despues de ordenar el alta de garantias, el siguiente hotspot claro del admin tecnico quedo en `AdminDevicesCatalogPage.tsx`. La pagina mezclaba slugify, filtros por tipo y marca, opciones derivadas, fetch de bloques y render completo de marcas/modelos/fallas en un solo archivo.
- Decision: mantener la ruta y el wiring con `adminApi.deviceTypes()` y `deviceCatalogApi` estables, pero mover slugify, tipos del feature, opciones de selects y filtros de modelos a `admin-devices-catalog.helpers.ts`, mover hero, filtros y las tres columnas operativas a `admin-devices-catalog.sections.tsx`, y dejar `AdminDevicesCatalogPage.tsx` como orquestador de fetch, sync y mutaciones. Tambien se agrega test unitario para helpers del feature.
- Impacto: `AdminDevicesCatalogPage.tsx` baja de forma marcada, el admin tecnico gana una frontera clara entre datos y UI, y el catalogo de dispositivos deja de concentrar helpers puros, opciones y bloques visuales en la misma pagina. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo la columna de modelos o saltar primero a `AdminOrderDetailPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en el catalogo tecnico, que todavia mezclaba demasiadas responsabilidades locales.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/{AdminDevicesCatalogPage.tsx,admin-devices-catalog.helpers.ts,admin-devices-catalog.helpers.test.ts,admin-devices-catalog.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0077]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminOrderDetailPage` pasa a orquestador y el detalle admin de pedidos gana helpers + sections propios
- Contexto: despues de ordenar el catalogo tecnico, el siguiente hotspot claro del frontend operativo quedo en `AdminOrderDetailPage.tsx`. La pagina mezclaba carga del pedido, calculo de metricas, labels derivados, alertas, seguimiento, listado de lineas, facts del cliente y panel de cambio de estado en un solo archivo.
- Decision: mantener la ruta y el wiring con `ordersApi` estables, pero mover metricas, facts, links y labels derivados a `admin-order-detail.helpers.ts`, mover estados de carga/error/not found, metricas, alertas y bloques visuales del detalle a `admin-order-detail.sections.tsx`, y dejar `AdminOrderDetailPage.tsx` como orquestador de fetch, sync de estado y guardado. Tambien se agrega test unitario para helpers del feature.
- Impacto: `AdminOrderDetailPage.tsx` baja de forma marcada, el subdominio `orders` queda mas consistente con el patron de helpers + sections ya usado en listado y ventas rapidas, y el detalle admin deja de mezclar estado derivado con toda la composicion visual. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo el sidebar de estado o saltar primero a `AdminRepairPricingRuleEditPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en el detalle operativo de pedidos, que todavia concentraba demasiadas responsabilidades.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/orders/{AdminOrderDetailPage.tsx,admin-order-detail.helpers.ts,admin-order-detail.helpers.test.ts,admin-order-detail.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0078]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminRepairPricingRuleCreatePage` y `AdminRepairPricingRuleEditPage` comparten una base comun de formulario
- Contexto: despues de ordenar el detalle de pedidos, el siguiente hotspot claro del admin tecnico quedo en el pricing puntual de reparaciones. `create` y `edit` duplicaban casi toda la estructura: carga de catalogo, filtros por tipo/marca/modelo/falla, payloads y formulario completo.
- Decision: mantener las rutas y el wiring con `adminApi`, `deviceCatalogApi` y `repairsApi` estables, pero mover tipos, defaults, opciones, transiciones dependientes y armado del payload a `admin-repair-pricing-rule-form.helpers.ts`, mover hero, feedback y formulario completo a `admin-repair-pricing-rule-form.sections.tsx`, y dejar `AdminRepairPricingRuleCreatePage.tsx` y `AdminRepairPricingRuleEditPage.tsx` como orquestadores de carga, sync y guardado. Tambien se agrega test unitario para helpers del feature compartido.
- Impacto: el pricing puntual deja de duplicar logica en dos pantallas casi gemelas, el subdominio `admin/pricing` gana una frontera comun mas clara y las pantallas de alta/edicion quedan mucho mas chicas. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo `edit` y dejar `create` como estaba, o saltar directo a `AdminModelGroupsPage.tsx`; descartado porque compartir la base comun elimina mas complejidad real y evita mantener dos refactors paralelos del mismo formulario.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/{AdminRepairPricingRuleCreatePage.tsx,AdminRepairPricingRuleEditPage.tsx,admin-repair-pricing-rule-form.helpers.ts,admin-repair-pricing-rule-form.helpers.test.ts,admin-repair-pricing-rule-form.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0079]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminModelGroupsPage` pasa a orquestador y el admin tecnico gana helpers + sections para grupos de modelos
- Contexto: despues de compartir la base del pricing puntual, `AdminModelGroupsPage.tsx` seguia como uno de los hotspots claros del admin tecnico. La pagina mezclaba filtros, opciones derivadas, patch local de grupos, feedback y los dos bloques visuales de grupos/modelos en un solo archivo.
- Decision: mantener la ruta y el wiring con `adminApi` y `deviceCatalogApi` estables, pero mover tipos, opciones y patch local a `admin-model-groups.helpers.ts`, mover hero, alerts, filtros y los dos bloques operativos a `admin-model-groups.sections.tsx`, y dejar `AdminModelGroupsPage.tsx` como orquestador de carga, mutaciones y asignacion. Tambien se agrega test unitario para helpers del feature.
- Impacto: el admin tecnico queda mas consistente entre pricing, catalogo de dispositivos y grupos de modelos, y la pagina deja de concentrar todo el render y la logica derivada en el mismo archivo. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo el bloque de grupos o saltar primero a `AdminWhatsappPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en cerrar el cluster del admin tecnico mientras el contexto de catalogo seguia fresco.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/{AdminModelGroupsPage.tsx,admin-model-groups.helpers.ts,admin-model-groups.helpers.test.ts,admin-model-groups.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0080]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminProductCreatePage` pasa a orquestador y el alta de catalogo comercial gana helpers + sections propios
- Contexto: despues de ordenar el admin tecnico, el siguiente hotspot claro del catalogo comercial quedo en `AdminProductCreatePage.tsx`. La pagina mezclaba carga de categorias/proveedores, recomendacion de pricing, validacion, payload de alta, preview de imagen y resumen previo en un solo archivo.
- Decision: mantener la ruta y el wiring con `adminApi`, `catalogAdminApi` y `productPricingApi` estables, pero mover validacion, armado del payload y resumen previo a `admin-product-create.helpers.ts`, mover header actions, feedback, loading y el layout completo del alta a `admin-product-create.sections.tsx`, y dejar `AdminProductCreatePage.tsx` como orquestador de carga, sync, preview y submit. Tambien se agrega test unitario para helpers del feature.
- Impacto: `AdminProductCreatePage.tsx` baja de forma marcada, `catalogAdmin` queda mas consistente entre categorias, listado, edicion y alta de productos, y el formulario deja de mezclar estado derivado, payload y toda la UI en el mismo archivo. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: unificar completo con `AdminProductEditPage.tsx` o saltar primero a `AdminWarrantiesPage.tsx`; descartado porque primero convenia cerrar la pantalla de alta con el mismo patron ya usado en `edit`, sin abrir un refactor mas transversal del subdominio.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/catalogAdmin/{AdminProductCreatePage.tsx,admin-product-create.helpers.ts,admin-product-create.helpers.test.ts,admin-product-create.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0081]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminWarrantiesPage` pasa a orquestador y el listado de garantias gana helpers + sections propios
- Contexto: despues de ordenar el alta de garantias y el catalogo comercial, el siguiente hotspot claro del subdominio `warranties` quedo en `AdminWarrantiesPage.tsx`. La pagina mezclaba query params manuales, resumen, top de proveedores, filtros, tabla completa y cierre de incidentes en un solo archivo.
- Decision: mantener la ruta y el wiring con `adminApi.warranties()` y `adminApi.closeWarranty()` estables, pero mover query building, defaults, formato monetario, labels derivados y clases de estado a `admin-warranties.helpers.ts`, mover hero, feedback, resumen, filtros y tabla a `admin-warranties.sections.tsx`, y dejar `AdminWarrantiesPage.tsx` como orquestador de fetch, refresh y cierre. Tambien se agrega test unitario para helpers del feature.
- Impacto: `AdminWarrantiesPage.tsx` baja de forma marcada, el subdominio `warranties` queda consistente entre alta y listado, y la pantalla deja de mezclar todo el render con logica derivada de filtros y presentacion. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo la tabla o saltar primero a `AdminWhatsappPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en cerrar el listado operativo de garantias, que aun concentraba demasiado estado local y render.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/warranties/{AdminWarrantiesPage.tsx,admin-warranties.helpers.ts,admin-warranties.helpers.test.ts,admin-warranties.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0082]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `AdminWhatsappPage` pasa a orquestador y el admin de templates/logs gana helpers + sections propios
- Contexto: despues de ordenar el listado de garantias, el siguiente hotspot claro del admin general quedo en `AdminWhatsappPage.tsx`. La pagina mezclaba defaults por estado, hydrate/save de templates, listado de variables, acciones del editor y logs recientes en un solo archivo.
- Decision: mantener la ruta y el wiring con `whatsappApi` y `whatsapp-ui` estables, pero mover defaults, orden canonico de templates, hydrate/save payloads y sanitizacion de logs a `admin-whatsapp.helpers.ts`, mover hero, feedback, variables, editor, acciones y logs a `admin-whatsapp.sections.tsx`, y dejar `AdminWhatsappPage.tsx` como orquestador de carga, guardado y refresh. Tambien se agrega test unitario para helpers del feature.
- Impacto: `AdminWhatsappPage.tsx` baja de forma marcada, el admin general queda mas consistente con el patron de helpers + sections y el subdominio de comunicaciones deja de mezclar todo el render con defaults y logica derivada de templates/logs. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo el bloque de logs o saltar primero a `CheckoutPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en cerrar el hotspot admin de WhatsApp, que todavia concentraba demasiadas responsabilidades locales.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/{AdminWhatsappPage.tsx,admin-whatsapp.helpers.ts,admin-whatsapp.helpers.test.ts,admin-whatsapp.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0083]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `CheckoutPage` pasa a orquestador y el flujo de compra gana helpers + sections propios
- Contexto: despues de ordenar el admin de WhatsApp, el siguiente hotspot operativo claro del frontend quedo en `CheckoutPage.tsx`. La pagina mezclaba quote del carrito, normalizacion de items locales, estados vacios, seleccion de pago, resumen final y confirmacion del pedido en un solo archivo.
- Decision: mantener la ruta y el wiring con `quoteCart`, `cartStorage`, `authStorage` y `ordersApi.checkout()` estables, pero mover opciones de pago, normalizacion del carrito, estados vacios, formato de montos y derivaciones de cuenta a `checkout.helpers.ts`, mover loading, empty state, pago, cuenta, acciones y resumen a `checkout.sections.tsx`, y dejar `CheckoutPage.tsx` como orquestador de carga, confirmacion y navegacion. Tambien se agrega test unitario para helpers del feature.
- Impacto: `CheckoutPage.tsx` baja de forma marcada, el flujo de compra queda mas consistente con el patron de helpers + sections y el checkout deja de mezclar todo el render con logica derivada de carrito y pago. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo el resumen o saltar primero a `MyAccountPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en cerrar el checkout, que es un flujo operativo mas sensible y todavia concentraba demasiadas responsabilidades.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/orders/{CheckoutPage.tsx,checkout.helpers.ts,checkout.helpers.test.ts,checkout.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0084]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `MyAccountPage` pasa a orquestador y el flujo autenticado de cuenta gana helpers + sections propios
- Contexto: despues de ordenar el checkout, el siguiente hotspot claro del frontend autenticado quedo en `MyAccountPage.tsx`. La pagina mezclaba hydrate del perfil, drafts de nombre/email/contrasena, validaciones, sincronizacion de `authStorage`, feedback y el render completo de perfil y seguridad en un solo archivo.
- Decision: mantener la ruta y el wiring con `authApi.account()`, `authApi.updateAccount()`, `authApi.updateAccountPassword()` y `authStorage` estables, pero mover drafts, normalizacion, validaciones y notices a `my-account.helpers.ts`, mover header actions, loading, feedback y las dos secciones visuales a `my-account.sections.tsx`, y dejar `MyAccountPage.tsx` como orquestador de fetch, guardado y sincronizacion. Tambien se agrega test unitario para helpers del feature.
- Impacto: `MyAccountPage.tsx` baja de forma marcada, el flujo autenticado de cuenta queda consistente con el patron de helpers + sections y la pantalla deja de mezclar estado derivado con todo el render de perfil/seguridad. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo el formulario de perfil o saltar primero a `CartPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en cerrar la pagina de cuenta completa, que todavia concentraba demasiadas responsabilidades locales.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/auth/{MyAccountPage.tsx,my-account.helpers.ts,my-account.helpers.test.ts,my-account.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0085]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `CartPage` pasa a orquestador y el flujo publico de carrito gana helpers + sections propios
- Contexto: despues de ordenar `MyAccountPage`, el siguiente hotspot claro del flujo publico quedo en `CartPage.tsx`. La pagina mezclaba quote del carrito, normalizacion de items validos, deteccion de stock issue, clamping de cantidades, feedback y el render completo de listado/resumen en un solo archivo.
- Decision: mantener la ruta y el wiring con `quoteCart()` y `useCartItems()` estables, pero mover formato monetario, stock tone, normalizacion de items, stock issue y clamping de cantidades a `cart.helpers.ts`, mover empty state, feedback, listado y resumen a `cart.sections.tsx`, y dejar `CartPage.tsx` como orquestador de fetch, normalizacion y navegacion. Tambien se agrega test unitario para helpers del feature.
- Impacto: `CartPage.tsx` baja de forma marcada, el flujo publico de compra queda mas consistente entre carrito y checkout, y la pantalla deja de mezclar estado derivado con todo el render del listado/resumen. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo el resumen o saltar primero a `StoreProductDetailPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en cerrar el carrito, que todavia concentraba demasiada logica operativa local.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/cart/{CartPage.tsx,cart.helpers.ts,cart.helpers.test.ts,cart.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0086]
- Fecha: 2026-03-31
- Estado: aceptada
- Tema: `StoreProductDetailPage` pasa a orquestador y el detalle publico de producto gana helpers + sections propios
- Contexto: despues de ordenar el carrito, el siguiente hotspot claro del storefront quedo en `StoreProductDetailPage.tsx`. La pagina mezclaba fetch del producto, formato de precio, estado de stock, clamping de cantidad, breadcrumb y todo el render de compra/meta/ayuda en un solo archivo.
- Decision: mantener la ruta y el wiring con `storeApi.product()` y `cartStorage.add()` estables, pero mover formato monetario, stock tone, disponibilidad, fallback description y clamping de cantidad a `store-product-detail.helpers.ts`, mover loading, empty state, breadcrumb y los bloques visuales del detalle a `store-product-detail.sections.tsx`, y dejar `StoreProductDetailPage.tsx` como orquestador de fetch, sync de cantidad y alta al carrito. Tambien se agrega test unitario para helpers del feature.
- Impacto: `StoreProductDetailPage.tsx` baja de forma marcada, el storefront queda mas consistente entre tienda, detalle, carrito y checkout, y la pantalla deja de mezclar estado derivado con todo el render del detalle publico. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo la card de compra o saltar primero a `AdminRepairsListPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en cerrar el flujo publico del producto antes de volver al frente operativo.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/store/{StoreProductDetailPage.tsx,store-product-detail.helpers.ts,store-product-detail.helpers.test.ts,store-product-detail.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0087]
- Fecha: 2026-04-01
- Estado: aceptada
- Tema: `AdminRepairsListPage` pasa a orquestador y el listado tecnico gana helpers + sections propios
- Contexto: despues de ordenar el storefront, el siguiente hotspot operativo claro del frontend quedo en `AdminRepairsListPage.tsx`. La pagina mezclaba fetch del listado, filtros, stats, formato de fechas/precios, labels comerciales y todo el render de la mesa operativa en un solo archivo.
- Decision: mantener la ruta y el wiring con `repairsApi.adminList()` estables, pero mover opciones de filtro, stats, filtros de texto/estado, labels derivados y formateos a `admin-repairs-list.helpers.ts`, mover header actions, metricas, toolbar y listado operativo a `admin-repairs-list.sections.tsx`, y dejar `AdminRepairsListPage.tsx` como orquestador de fetch y composicion. Tambien se agrega test unitario para helpers del feature.
- Impacto: `AdminRepairsListPage.tsx` baja de forma marcada, el subdominio `repairs` queda mas consistente entre listado, alta, detalle y pricing, y la mesa operativa deja de mezclar estado derivado con todo el render del listado tecnico. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo la fila operativa o saltar primero a `AdminWhatsappOrdersPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en cerrar el listado tecnico, que todavia concentraba demasiadas responsabilidades locales.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/repairs/{AdminRepairsListPage.tsx,admin-repairs-list.helpers.ts,admin-repairs-list.helpers.test.ts,admin-repairs-list.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0088]
- Fecha: 2026-04-01
- Estado: aceptada
- Tema: `AdminWhatsappOrdersPage` pasa a orquestador y el canal de pedidos gana helpers + sections propios
- Contexto: despues de ordenar el listado admin de reparaciones, el siguiente hotspot claro del admin operativo quedo en `AdminWhatsappOrdersPage.tsx`. La pagina mezclaba defaults de plantillas, hydrate/save del canal `orders`, variables disponibles, editor por estado y logs recientes en un solo archivo.
- Decision: mantener la ruta y el wiring con `whatsappApi` y `whatsapp-ui` estables, pero mover defaults, orden canonico, hydrate/save input y normalizacion de logs a `admin-whatsapp-orders.helpers.ts`, mover hero, feedback, variables, editor, acciones y logs a `admin-whatsapp-orders.sections.tsx`, y dejar `AdminWhatsappOrdersPage.tsx` como orquestador de carga, guardado y refresh. Tambien se agrega test unitario para helpers del feature.
- Impacto: `AdminWhatsappOrdersPage.tsx` baja de forma marcada, el subdominio de comunicaciones queda mas consistente entre reparaciones y pedidos, y la pantalla deja de mezclar estado derivado con todo el render del canal `orders`. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo el bloque de logs o saltar primero a `AdminAccountingPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en cerrar el hotspot de comunicaciones, que todavia concentraba demasiadas responsabilidades locales.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/{AdminWhatsappOrdersPage.tsx,admin-whatsapp-orders.helpers.ts,admin-whatsapp-orders.helpers.test.ts,admin-whatsapp-orders.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0089]
- Fecha: 2026-04-01
- Estado: aceptada
- Tema: `AdminAccountingPage` pasa a orquestador y contabilidad gana helpers + sections propios
- Contexto: despues de ordenar el canal de WhatsApp para pedidos, el siguiente hotspot claro del admin operativo quedo en `AdminAccountingPage.tsx`. La pagina mezclaba fetch del libro, filtros, opciones, cards de resumen, comparativo por categoria y tabla de movimientos en un solo archivo.
- Decision: mantener la ruta y el wiring con `adminApi.accounting()` estables, pero mover formato monetario, opciones, params de request y tonos de ingresos/egresos a `admin-accounting.helpers.ts`, mover hero, feedback, resumen, comparativo por categoria, filtros y tabla a `admin-accounting.sections.tsx`, y dejar `AdminAccountingPage.tsx` como orquestador de fetch y composicion. Tambien se agrega test unitario para helpers del feature.
- Impacto: `AdminAccountingPage.tsx` baja de forma marcada, el subdominio operativo queda mas consistente con el patron `helpers + sections`, y la pantalla deja de mezclar estado derivado con todo el render del libro contable. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo la tabla o saltar primero a `Admin2faSecurityPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en cerrar el hotspot operativo de contabilidad, que todavia concentraba demasiadas responsabilidades locales.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/accounting/{AdminAccountingPage.tsx,admin-accounting.helpers.ts,admin-accounting.helpers.test.ts,admin-accounting.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0090]
- Fecha: 2026-04-01
- Estado: aceptada
- Tema: `Admin2faSecurityPage` pasa a orquestador y la seguridad 2FA gana helpers + sections propios
- Contexto: despues de ordenar `AdminAccountingPage`, el siguiente hotspot claro del admin de configuracion quedo en `Admin2faSecurityPage.tsx`. La pagina mezclaba fetch del estado, generacion del secreto, validaciones del codigo, QR, feedback y todo el render de activacion/desactivacion en un solo archivo.
- Decision: mantener la ruta y el wiring con `adminSecurityApi` estables, pero mover derivaciones de estado, QR, normalizacion/validacion del codigo y mensajes de exito/error a `admin-2fa-security.helpers.ts`, mover header, feedback, loading, empty state y card de estado a `admin-2fa-security.sections.tsx`, y dejar `Admin2faSecurityPage.tsx` como orquestador de fetch, generacion, activacion, desactivacion y composicion. Tambien se agrega test unitario para helpers del feature.
- Impacto: `Admin2faSecurityPage.tsx` baja de forma marcada, el admin de seguridad queda consistente con el patron `helpers + sections` y la pantalla deja de mezclar estado derivado con todo el render 2FA. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado.
- Alternativas consideradas: partir solo la card de setup o saltar primero a `AdminUsersPage.tsx`; descartado porque el mayor retorno inmediato seguia estando en cerrar el hotspot de seguridad, que todavia concentraba demasiadas responsabilidades locales.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/{Admin2faSecurityPage.tsx,admin-2fa-security.helpers.ts,admin-2fa-security.helpers.test.ts,admin-2fa-security.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0091]
- Fecha: 2026-04-01
- Estado: aceptada
- Tema: cierre del seccionado pendiente del frontend en admin general, catalogo tecnico y flujos publicos/detalle
- Contexto: despues de ordenar `Admin2faSecurityPage`, seguian varias pantallas medianas que todavia mezclaban fetch, filtros, payloads, validaciones y render completo dentro de un solo `Page.tsx`. El objetivo era cerrar el frente pendiente y dejar el patron `Page + helpers + sections` aplicado de forma consistente en los hotspots restantes del frontend.
- Decision: partir `AdminUsersPage`, `AdminSettingsHubPage`, `AdminAlertsPage`, `AdminHelpFaqPage`, `AdminRepairTypesPage`, `AdminDeviceTypesPage`, `RepairDetailPage`, `OrderDetailPage`, `PublicRepairLookupPage` y `PublicRepairQuoteApprovalPage`, moviendo logica pura, derivaciones, metricas, payloads y bloques visuales a helpers/sections dedicados. Se agrega una utilidad compartida minima para slug en catalogo tecnico (`admin-taxonomy.helpers.ts`) y se suman tests unitarios para los helpers nuevos.
- Impacto: el seccionado pendiente del frontend queda cerrado en las pantallas que todavia concentraban demasiada responsabilidad local. No hay cambios deliberados en rutas, payloads ni comportamiento visible esperado; solo se formaliza una estructura interna mas simple, predecible y uniforme.
- Alternativas consideradas: seguir refactorizando solo paginas de mayor cantidad de lineas o dejar algunas pantallas medianas sin tocar; descartado porque rompia la consistencia del criterio de seccionado y dejaba un cierre parcial del frente.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/{AdminUsersPage.tsx,admin-users.helpers.ts,admin-users.helpers.test.ts,admin-users.sections.tsx,AdminSettingsHubPage.tsx,admin-settings-hub.helpers.ts,admin-settings-hub.helpers.test.ts,admin-settings-hub.sections.tsx,AdminAlertsPage.tsx,admin-alerts.helpers.ts,admin-alerts.helpers.test.ts,admin-alerts.sections.tsx,AdminHelpFaqPage.tsx,admin-help-faq.helpers.ts,admin-help-faq.helpers.test.ts,admin-help-faq.sections.tsx,AdminRepairTypesPage.tsx,admin-repair-types.helpers.ts,admin-repair-types.helpers.test.ts,admin-repair-types.sections.tsx,AdminDeviceTypesPage.tsx,admin-device-types.helpers.ts,admin-device-types.helpers.test.ts,admin-device-types.sections.tsx,admin-taxonomy.helpers.ts}`, `next-stack/apps/web/src/features/orders/{OrderDetailPage.tsx,order-detail.helpers.ts,order-detail.helpers.test.ts,order-detail.sections.tsx}`, `next-stack/apps/web/src/features/repairs/{RepairDetailPage.tsx,repair-detail.helpers.ts,repair-detail.helpers.test.ts,repair-detail.sections.tsx,PublicRepairLookupPage.tsx,public-repair-lookup.helpers.ts,public-repair-lookup.helpers.test.ts,public-repair-lookup.sections.tsx,PublicRepairQuoteApprovalPage.tsx,public-repair-quote-approval.helpers.ts,public-repair-quote-approval.helpers.test.ts,public-repair-quote-approval.sections.tsx}`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0092]
- Fecha: 2026-04-01
- Estado: aceptada
- Tema: `RepairProviderPartPricingSection` pasa de orquestador pesado a shell de composicion con hook dedicado
- Contexto: aunque el seccionado pendiente del frontend ya habia quedado cerrado en las pantallas `Page.tsx`, el flujo tecnico mas sensible de `repairs` seguia dejando demasiada logica async y derivada dentro de `RepairProviderPartPricingSection.tsx`. El componente mezclaba carga de proveedores, busqueda agregada, preview, snapshot draft y todo el render de la seccion en un mismo archivo.
- Decision: mantener la interfaz publica del componente y sus subpiezas visuales estables, pero mover el estado async, los requests, el preview derivado, el manejo de snapshot draft y los handlers a `use-repair-provider-part-pricing.ts`. El componente principal queda como shell de composicion y se limpia el copy roto del feature a ASCII consistente.
- Impacto: `RepairProviderPartPricingSection.tsx` baja de complejidad real sin cambiar rutas, payloads ni contratos del modulo. El feature queda mas simple de leer, mas seguro para seguir afinando y mas consistente con la metodologia de seccionado aplicada al resto del frontend.
- Alternativas consideradas: partir solo `repair-provider-part-pricing-section.search.tsx` o saltar directo a `AppShell.tsx`; descartado porque el mayor retorno inmediato estaba en sacar el estado async del flujo tecnico mas complejo sin volver a abrir un frente global.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/repairs/{RepairProviderPartPricingSection.tsx,use-repair-provider-part-pricing.ts,repair-provider-part-pricing-section.search.tsx,repair-provider-part-pricing-section.preview.tsx}`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0093]
- Fecha: 2026-04-01
- Estado: aceptada
- Tema: `AdminRepairDetailPage` pasa de shell cargado a shell liviano con hook dedicado
- Contexto: despues de mover el flujo tecnico de proveedor + repuesto a un hook, el siguiente shell con mayor retorno dentro de `repairs` era `AdminRepairDetailPage.tsx`. Aunque ya estaba seccionada en helpers + sections, todavia mezclaba fetch del caso, timeline, pricing suggestion, validacion, guardado, notices y wiring del snapshot en la misma pagina.
- Decision: mantener la ruta, las sections y la interfaz visible estables, pero mover la orquestacion del detalle a `use-admin-repair-detail.ts`. La pagina queda como shell de composicion y el hook concentra fetch, reload, save, pricing suggestion, estado derivado del formulario y wiring hacia `RepairProviderPartPricingSection`.
- Impacto: baja la complejidad real del shell principal de detalle sin cambiar contratos ni comportamiento esperado. El subdominio `repairs` queda mas consistente: sections visuales, helpers puros y hooks para la orquestacion pesada.
- Alternativas consideradas: seguir refinando `AppShell.tsx` o partir otra `sections.tsx`; descartado porque el mayor retorno inmediato seguia estando en el flujo admin tecnico mas cargado del repo.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/repairs/{AdminRepairDetailPage.tsx,use-admin-repair-detail.ts}`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0094]
- Fecha: 2026-04-01
- Estado: aceptada
- Tema: `AdminRepairCreatePage` pasa de shell cargado a shell liviano con hook dedicado
- Contexto: despues de aliviar `AdminRepairDetailPage`, el siguiente shell mas cargado dentro de `repairs` era `AdminRepairCreatePage.tsx`. Aunque ya estaba seccionada en helpers + sections, todavia mezclaba carga de catalogo, sincronizacion de selects, pricing suggestion, validacion, submit y wiring del snapshot en la misma pagina.
- Decision: mantener la ruta, las sections y la interfaz visible estables, pero mover la orquestacion del alta a `use-admin-repair-create.ts`. La pagina queda como shell de composicion y el hook concentra catalogo, estado derivado del formulario, pricing suggestion, submit y wiring hacia `RepairProviderPartPricingSection`.
- Impacto: baja la complejidad real del shell principal de alta sin cambiar contratos ni comportamiento esperado. El subdominio `repairs` queda mas consistente: detail y create ya siguen el mismo patron de shell liviano + hook + helpers + sections.
- Alternativas consideradas: seguir refinando `AppShell.tsx` o volver al listado admin; descartado porque el mayor retorno inmediato seguia estando en cerrar el par create/detail con el mismo criterio.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/repairs/{AdminRepairCreatePage.tsx,use-admin-repair-create.ts}`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0095]
- Fecha: 2026-04-01
- Estado: aceptada
- Tema: `AppShell` pasa de shell con demasiada orquestacion local a shell de composicion con hook dedicado
- Contexto: aunque `AppShell.tsx` ya habia delegado bastante UI a `layouts/app-shell/*`, todavia mezclaba listeners globales, sync de auth y branding, media-query, bloqueo de scroll, foco accesible del menu de cuenta y armado de links dentro del mismo archivo. Eso dejaba demasiada responsabilidad transversal en el shell principal.
- Decision: mantener header, footer, sidebar y menu de cuenta visibles sin cambios deliberados, pero mover la orquestacion transversal a `layouts/app-shell/use-app-shell.ts` y extraer el armado de links/datos derivados a `layouts/app-shell/helpers.ts`. `AppShell.tsx` queda como punto de composicion y los calculos puros del shell quedan cubiertos por tests.
- Impacto: baja la complejidad real del shell global sin cambiar rutas, branding visible ni comportamiento de autenticacion. El layout transversal queda mas consistente con la metodologia aplicada al resto del frontend: shell liviano, hook para orquestacion y helpers puros testeables.
- Alternativas consideradas: seguir refinando solo `repairs` o partir todavia mas componentes visuales del shell; descartado porque el mayor retorno inmediato estaba en sacar la orquestacion transversal del archivo principal sin reabrir otra capa de UI.
- Archivos / modulos afectados: `next-stack/apps/web/src/layouts/{AppShell.tsx}`, `next-stack/apps/web/src/layouts/app-shell/{helpers.ts,helpers.test.ts,use-app-shell.ts}`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0096]
- Fecha: 2026-04-13
- Estado: aceptada
- Tema: el flujo de proveedor + repuesto se parte entre busqueda de proveedores y preview tecnico
- Contexto: `use-repair-provider-part-pricing.ts` ya habia bajado la carga del componente principal, pero seguia mezclando demasiadas responsabilidades: carga de proveedores, busqueda agregada, hidratacion desde snapshot activo, validacion de inputs de costo, preview tecnico y aplicacion del draft en un solo hook largo.
- Decision: mantener estable `RepairProviderPartPricingSection.tsx` y sus panels, pero separar el flujo en dos capas. `use-repair-provider-part-search.ts` concentra proveedores, busqueda, seleccion e hidratacion; `use-repair-provider-part-pricing.ts` queda enfocado en preview, snapshot draft, sugerido y status general. La logica derivada transversal se consolida en `repair-provider-part-pricing-section.helpers.ts` con mas cobertura de tests.
- Impacto: baja la complejidad real del hotspot tecnico mas pesado del frontend sin tocar rutas, payloads ni comportamiento esperado del flujo create/detail. El modulo `repairs` queda mas facil de mantener porque la frontera entre "buscar proveedor" y "calcular/aplicar snapshot" ahora es explicita.
- Alternativas consideradas: seguir rompiendo `sections.tsx` o atacar otro feature grande; descartado porque el mayor retorno inmediato seguia estando en el hook tecnico mas denso del repo.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/repairs/{use-repair-provider-part-pricing.ts,use-repair-provider-part-search.ts,repair-provider-part-pricing-section.helpers.ts,repair-provider-part-pricing-section.helpers.test.ts}`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0097]
- Fecha: 2026-04-13
- Estado: aceptada
- Tema: `admin-repair-detail.sections.tsx` se divide en panels visuales mas chicos
- Contexto: despues de sacar la orquestacion de `AdminRepairDetailPage.tsx`, el siguiente punto denso dentro del detalle admin seguia siendo `admin-repair-detail.sections.tsx`, que todavia mezclaba stats, badges de estado, pricing sugerido y sidebar tecnica en un unico archivo visual demasiado cargado.
- Decision: mantener estable `AdminRepairDetailPage.tsx`, `use-admin-repair-detail.ts` y la interfaz visible, pero partir `admin-repair-detail.sections.tsx` en panels visuales mas chicos: `admin-repair-detail-status-panels.tsx`, `admin-repair-detail-pricing-panels.tsx` y `admin-repair-detail-sidebar.tsx`. El archivo `sections` queda como composicion de bloques y preserva la frontera publica del feature.
- Impacto: baja la densidad visual y facilita mantenimiento local del detalle admin sin tocar rutas, payloads ni reglas de negocio. El subdominio `repairs` queda mas consistente: shell liviano, hook de orquestacion, helpers puros y panels visuales separados.
- Alternativas consideradas: seguir refinando hooks del mismo feature o saltar a otro `sections.tsx`; descartado porque el mayor retorno inmediato estaba en cerrar el hotspot visual restante del detalle admin antes de movernos a otro subdominio.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/repairs/{admin-repair-detail.sections.tsx,admin-repair-detail-status-panels.tsx,admin-repair-detail-pricing-panels.tsx,admin-repair-detail-sidebar.tsx}`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0098]
- Fecha: 2026-04-13
- Estado: aceptada
- Tema: `admin-repair-create.sections.tsx` se divide en panels visuales mas chicos
- Contexto: despues de dejar `AdminRepairCreatePage.tsx` como shell con hook dedicado, el siguiente hotspot del alta admin seguia estando en `admin-repair-create.sections.tsx`, que todavia concentraba datos basicos, diagnostico/pricing y cierre/resumen en un solo archivo visual largo.
- Decision: mantener estable `AdminRepairCreatePage.tsx`, `use-admin-repair-create.ts` y la interfaz visible, pero partir `admin-repair-create.sections.tsx` en tres panels visuales: `admin-repair-create-basic-panel.tsx`, `admin-repair-create-diagnosis-panel.tsx` y `admin-repair-create-submit-panel.tsx`. El archivo `sections` queda como frontera publica y composicion del feature.
- Impacto: baja la densidad visual del alta admin sin tocar rutas, payloads ni reglas de negocio. El subdominio `repairs` queda mas parejo entre create y detail: page shell, hook de orquestacion, helpers puros y panels visuales dedicados.
- Alternativas consideradas: seguir refinando hooks o saltar directo a otro subdominio; descartado porque el mayor retorno inmediato estaba en cerrar el par visual de create/detail con el mismo criterio.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/repairs/{AdminRepairCreatePage.tsx,admin-repair-create.sections.tsx,admin-repair-create-basic-panel.tsx,admin-repair-create-diagnosis-panel.tsx,admin-repair-create-submit-panel.tsx}`, `project-docs/frontend/FRONTEND_MAP.md`, `project-docs/architecture/ARCHITECTURE.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `qa:route-parity`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0099]
- Fecha: 2026-04-13
- Estado: aceptada
- Tema: el catalogo tecnico de dispositivos habilita borrado explicito, pero solo cuando marca/modelo/falla no estan en uso
- Contexto: en el admin de catalogo de dispositivos ya existian endpoints `DELETE` para marcas, modelos y fallas, pero la UI solo exponia renombrar y activar/desactivar. Ademas, varias referencias de `repairs` y `repairPricingRules` usan ids logicos que no siempre quedan protegidos por FK directas, por lo que habilitar un borrado ciego desde la pantalla podia dejar referencias colgadas.
- Decision: exponer `Eliminar` en la UI de marcas, modelos y fallas con confirmacion explicita e irreversible, mantener `Desactivar` como opcion segura, y endurecer `DeviceCatalogService` para bloquear el borrado cuando el item siga referenciado por reparaciones o reglas de precio. Si el borrado queda bloqueado por relaciones de base de datos, el backend devuelve un mensaje legible.
- Impacto: el admin de catalogo tecnico gana el flujo que faltaba sin convertir `Eliminar` en un hard delete inseguro. La politica operativa pasa a ser: se puede borrar solo lo no usado; si ya existe uso historico u operativo, se desactiva. No cambia ninguna ruta publica ni se agregan endpoints nuevos.
- Alternativas consideradas: exponer solo el boton de borrado y confiar en el backend actual, o mantener borrado oculto y obligar siempre a desactivar; descartado porque la primera opcion dejaba inconsistencias posibles y la segunda no resolvia la necesidad operativa del usuario.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/admin/{AdminDevicesCatalogPage.tsx,admin-devices-catalog.sections.tsx}`, `next-stack/apps/api/src/modules/device-catalog/{device-catalog.service.ts,device-catalog.service.test.ts}`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/api`, `typecheck --workspace @nico/web`, `test --workspace @nico/api`, `build --workspace @nico/api`, `build --workspace @nico/web`, `smoke:backend`, `smoke:web`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0100]
- Fecha: 2026-04-13
- Estado: aceptada
- Tema: el acceso publico deja de promocionar registro global y auth gana una navbar liviana propia
- Contexto: las vistas de auth estaban aisladas del shell publico, por eso login/registro no mostraban navbar. Al mismo tiempo, el acceso no autenticado mostraba CTAs redundantes y el alta publica aparecia en lugares demasiado globales para el flujo deseado.
- Decision: mantener `/auth/register` publico, pero dejar de promocionarlo en navbar/sidebar/empty states generales. `AuthLayout` pasa a incluir una topbar publica liviana con marca, `Tienda`, `Reparacion`, `Ayuda` y un unico CTA de login. El registro queda recomendado solo dentro de `LoginPage`. `VerifyEmailPage` se alinea al mismo shell y deja de derivar a registro desde estado sin contexto.
- Impacto: mejora la consistencia visual de auth, desaparece el CTA global de crear cuenta y el flujo de acceso queda mas claro: un solo ingreso publico y recomendacion contextual de registro desde login. No cambian rutas ni APIs.
- Alternativas consideradas: reutilizar `AppShell` completo en auth o dejar auth aislado y solo limpiar botones; descartado porque el shell completo arrastraba UI de app logueada y la segunda opcion no resolvia la falta de navbar ni el desorden visual del acceso.
- Archivos / modulos afectados: `next-stack/apps/web/src/{App.tsx}`, `next-stack/apps/web/src/features/auth/{AuthLayout.tsx,LoginPage.tsx,RegisterPage.tsx,VerifyEmailPage.tsx}`, `next-stack/apps/web/src/layouts/{AppShell.tsx}`, `next-stack/apps/web/src/layouts/app-shell/mobile-sidebar.tsx`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0101]
- Fecha: 2026-04-13
- Estado: aceptada
- Tema: auth adopta una escena visual propia de dos paneles, pero sin separarse del sistema visual de Nico
- Contexto: despues de limpiar la politica de acceso publico, el problema restante era visual y estructural. Login, registro y recuperacion seguian funcionando, pero la experiencia de auth no tenia una identidad clara y quedaba demasiado plana frente a la referencia deseada. Al mismo tiempo, no convenia reusar `AppShell` completo ni contaminar `layout.css` o `components.css` con un rediseño especifico de auth.
- Decision: mantener `AuthLayout` como shell publico de auth, pero rehacerlo con dos capas: `topbar` liviana y `auth-scene` propia debajo. La escena usa una composicion de dos paneles con un bloque izquierdo visual puro y un bloque derecho para encabezado + cards del flujo. El styling vive en `styles/auth.css` y queda encapsulado al subdominio `auth`. `LoginPage` mantiene la recomendacion de alta como unico punto publico de registro; `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `VerifyEmailPage` y `BootstrapAdminPage` heredan el mismo shell con distinta sobriedad de contenido.
- Impacto: auth gana una identidad visual consistente, mas cercana a la referencia deseada, sin tocar APIs, rutas ni contratos globales de `Button`, `TextField` o `SectionCard`. El repo mantiene orden visual porque el cambio no invade el styling del resto de los contextos (`store`, `admin`, `account`).
- Alternativas consideradas: copiar casi literal la referencia o rediseñar componentes globales para que el efecto salga "solo" desde el sistema; descartado porque lo primero rompia la identidad de Nico y lo segundo contaminaba estilos transversales por una necesidad localizada.
- Archivos / modulos afectados: `next-stack/apps/web/src/features/auth/{AuthLayout.tsx,LoginPage.tsx,RegisterPage.tsx,ForgotPasswordPage.tsx,ResetPasswordPage.tsx,VerifyEmailPage.tsx,BootstrapAdminPage.tsx}`, `next-stack/apps/web/src/styles/{auth.css}`, `next-stack/apps/web/src/styles.css`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:web`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0102]
- Fecha: 2026-04-15
- Estado: aceptada
- Tema: la busqueda agregada de repuestos debe priorizar precio final visible y exponer siempre el estado por proveedor
- Contexto: el flujo de repuestos de `repairs` mostraba resultados agregados rankeados, pero el parser HTML seguia permitiendo que numeros parciales, precios tachados o snippets ambiguos contaminaran el `price` final. A la vez, varios proveedores consultados quedaban invisibles en la UI cuando devolvian `empty` o `error`, lo que hacia parecer que no se habian buscado. La configuracion persistida de proveedores tambien podia quedar desalineada del catalogo default del codigo.
- Decision: mantener el endpoint agregado actual y endurecer el parsing por proveedor con perfiles dedicados donde haga falta, pero cambiar la politica de precio a `precio final visible de venta > precio regular si no hay final`. Para `tiendamovilrosario.com.ar` se agrega perfil `xstore`; `elreparadordepc.com` pasa a JSON API; `celuphone`, `evophone`, `okeyrosario` y `electrostore` quedan cubiertos por fixtures explicitas. `AdminProviderSearchService` sincroniza una vez por proceso el catalogo default hacia la base usando import por nombre para evitar endpoints viejos sin duplicar filas. En frontend, la busqueda de repuestos muestra siempre la lista de proveedores consultados con estado `con resultados`, `sin resultados` o `error`, usando el bloque `suppliers` ya devuelto por backend.
- Impacto: el precio visible en resultados agregados queda alineado con el precio final real del proveedor en los casos reportados, la cobertura de proveedores deja de quedar opaca para el operador y la configuracion persistida se autocorrige contra el catalogo actual sin migraciones ni nuevos endpoints publicos.
- Alternativas consideradas: seguir afinando solo el ranking agregado o agregar endpoints nuevos de trazabilidad; descartado porque el ranking no corrige un parser defectuoso y el payload `suppliers` existente ya alcanzaba para hacer visible el estado real por proveedor.
- Archivos / modulos afectados: `next-stack/apps/api/src/modules/admin/{admin-provider-search.parsers.ts,admin-provider-search.parsers.test.ts,admin-provider-search.service.ts,admin-provider-registry.service.ts,admin-provider-registry.service.test.ts,admin-provider-search.text.ts}`, `next-stack/apps/web/src/features/repairs/{repair-provider-part-search-results.tsx,use-repair-provider-part-pricing.ts}`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/api`, `test --workspace @nico/api`, `build --workspace @nico/api`, `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:backend`, `smoke:web`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0103]
- Fecha: 2026-04-15
- Estado: aceptada
- Tema: la busqueda agregada de repuestos pasa a consultar solo proveedores reales marcados y aplica matching exacto antes de rankear
- Contexto: el agregado de repuestos seguia mezclando proveedores dummy/historicos con proveedores reales porque la seleccion del pool dependia solo de `active + searchEnabled + endpoint`. A la vez, algunos proveedores devolvian resultados de otras marcas o de otros tipos de repuesto para queries exactas como `Modulo Redmi 13C`, y la UI del flujo de reparaciones habia quedado demasiado orientada a auditar el fan-out tecnico en lugar de elegir un repuesto util.
- Decision: agregar `Supplier.searchInRepairs` como bandera explicita para inclusion en la busqueda agregada del flujo de reparaciones. El agregado consulta solo `active && searchEnabled && searchInRepairs && searchEndpoint`, mientras que `probeProvider` y la busqueda directa por proveedor siguen disponibles sin esa restriccion. El filtro final pasa a ser `matching exacto primero, ranking despues`, usando `matchesSupplierPartExactQuery()` para exigir tokens especificos reales y descartar respuestas cruzadas. La UI de `repairs` vuelve a centrarse solo en la lista de resultados utiles, sin cards visibles por proveedor ni detalle tecnico de fallos.
- Impacto: el operador vuelve a ver una lista limpia de repuestos comparables; los proveedores dummy dejan de contaminar el agregado; y la relevancia del resultado se endurece lo suficiente como para preferir `0 resultados` antes que mostrar repuestos de otra marca/modelo. En admin, cada proveedor ahora expone `Incluir en busqueda de reparaciones` para controlar si entra o no al agregado.
- Alternativas consideradas: filtrar proveedores reales por heuristica de nombre o mantener la trazabilidad por proveedor visible y confiar solo en ranking; descartado porque la heuristica por nombre es fragil y el ranking por si solo no evita falsos positivos fuertes.
- Archivos / modulos afectados: `next-stack/apps/api/prisma/{schema.prisma,migrations/20260415103000_add_supplier_search_in_repairs/migration.sql}`, `next-stack/apps/api/src/modules/admin/{admin-provider-registry.service.ts,admin-provider-registry.service.test.ts,admin-provider-search.service.ts,admin-provider-search.service.test.ts,admin-provider-search.parsers.ts,admin-provider-search.parsers.test.ts,admin-provider-search-ranking.ts,admin-providers.types.ts,admin-providers.service.ts,admin.schemas.ts,admin.service.ts}`, `next-stack/apps/web/src/features/{admin/api.ts,providers/{AdminProvidersPage.tsx,admin-providers.helpers.ts,admin-providers.helpers.test.ts,admin-providers-panels.tsx},repairs/{use-repair-provider-part-search.ts,use-repair-provider-part-pricing.ts,repair-provider-part-pricing-section.helpers.ts,repair-provider-part-pricing-section.helpers.test.ts,repair-provider-part-search-results.tsx},warranties/admin-warranty-create.helpers.test.ts}`, `project-docs/{DECISIONS_LOG.md,backend/BACKEND_MAP.md,frontend/FRONTEND_MAP.md}`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/api`, `test --workspace @nico/api`, `build --workspace @nico/api`, `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `db:migrate --workspace @nico/api`, `smoke:backend`, `smoke:web`, `git diff --check`.
- Responsable: Codex + operador humano

### [DL-0104]
- Fecha: 2026-04-16
- Estado: aceptada
- Tema: los assets de identidad visual del login y branding publico se resuelven desde `apps/web/public`, no desde `STORE_IMAGE_BASE_URL`
- Contexto: el upload de identidad visual escribe los fondos de auth, hero e iconos en `next-stack/apps/web/public` usando `PublicAssetStorageService`, pero `StoreService` seguia resolviendo varios de esos paths con `STORE_IMAGE_BASE_URL` como si fueran assets legacy de `storage`. Eso hacia que el login y otros recursos de branding pudieran apuntar al host equivocado. En paralelo, la UI de identidad visual mostraba previews genericos y paths "bonitos" aunque el asset real todavia no estuviera configurado.
- Decision: mantener `STORE_IMAGE_BASE_URL` solo para assets `storage/` y resolver branding/auth como rutas publicas de la web (`/brand/...`, `/brand-assets/...`, `/icons/...`, favicons). En admin, los slots opcionales sin archivo configurado pasan a mostrarse como vacios y cada card puede declarar `recommendedPx` para informar medidas sugeridas en el mismo punto de carga. Para `auth`, si no existe una personalizacion guardada, el frontend consume un fallback explicito `brand/logo-bg.png` para poder verificar visualmente el circuito del fondo de login sin depender de un upload previo.
- Impacto: el fondo visual del login y el resto del branding publico usan la misma fuente canonica de assets (`apps/web/public`) sin mezclar host legacy. La UI de identidad visual deja de inducir a error cuando aun no hay imagen cargada y da una referencia concreta de tamanos recomendados para desktop y mobile. Ademas, login deja de quedar sin imagen mientras el slot de auth sigue en estado por defecto.
- Alternativas consideradas: seguir prefijando branding con `STORE_IMAGE_BASE_URL`, mostrar previews genericos mientras no haya archivo o dejar `auth` sin imagen hasta que exista upload; descartado porque la primera opcion rompe la fuente canonica de assets, la segunda oculta el estado real de configuracion y la tercera dificulta validar que el circuito funciona de punta a punta.
- Archivos / modulos afectados: `next-stack/apps/api/src/modules/store/store.service.ts`, `next-stack/apps/api/src/modules/store/store.service.test.ts`, `next-stack/apps/web/src/features/admin/{brandAssetsApi.ts,admin-visual-identity.helpers.ts,admin-visual-identity.helpers.test.ts,admin-visual-identity.sections.tsx}`, `project-docs/architecture/ASSET_STRATEGY.md`, `project-docs/DECISIONS_LOG.md`, `CHANGELOG_AI.md`.
- Validacion requerida: `typecheck --workspace @nico/api`, `test --workspace @nico/api`, `build --workspace @nico/api`, `typecheck --workspace @nico/web`, `test --workspace @nico/web`, `build --workspace @nico/web`, `smoke:backend`, `smoke:web`, `git diff --check`.
- Responsable: Codex + operador humano
