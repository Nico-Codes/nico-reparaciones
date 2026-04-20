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

### 2026-04-16 - Codex
- Alcance: agregar Sign in with Apple para clientes reutilizando el patron de Google y hacer visible la disponibilidad real de providers sociales desde el backend.
- Tipo de intervencion: cambio funcional full-stack sobre auth social, modelo `User`, callbacks OAuth y login web.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/auth/{auth.controller.ts,auth.service.ts,auth.service.test.ts,users.service.ts}`
  - `next-stack/apps/api/src/main.ts`
  - `next-stack/apps/api/prisma/{schema.prisma,migrations/20260416120000_add_apple_subject_to_user/migration.sql}`
  - `next-stack/packages/contracts/src/index.ts`
  - `next-stack/apps/web/src/features/auth/{api.ts,AppleAuthCallbackPage.tsx,GoogleAuthCallbackPage.tsx,LoginPage.tsx,google-auth.helpers.ts,google-auth.helpers.test.ts}`
  - `next-stack/apps/web/src/{App.tsx,app/routing/route-pages.tsx}`
  - `next-stack/.env.example`
  - `next-stack/.env.production.example`
  - `project-docs/{DECISIONS_LOG.md,backend/BACKEND_MAP.md,frontend/FRONTEND_MAP.md}`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. `LoginPage` ya no muestra Google por defecto: consulta `/api/auth/social/providers` y presenta Google y/o Apple solo si el backend los tiene realmente configurados. El backend suma `Sign in with Apple` para cuentas `USER`, con vinculo por email, creacion de cuenta cliente nueva y rechazo explicito para `ADMIN`.
- Validaciones ejecutadas:
  - `cmd /c npm run db:generate --workspace @nico/api`
  - `cmd /c npm run db:migrate --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run smoke:web`
- Riesgos / notas:
  - el flujo real con Apple requiere credenciales `APPLE_*` validas en el entorno; los tests cubren firma, callback y linking, pero no reemplazan una pasada manual con un Service ID real
  - el runtime backend quedo nuevamente con Prisma engine local despues de regenerar el cliente en modo normal; no dejar `engine=none` para ejecucion real

---

### 2026-04-16 - Codex
- Alcance: corregir la extraccion de precio para Celuphone en la busqueda de repuestos y documentar la limitacion actual de PuntoCell.
- Tipo de intervencion: ajuste backend puntual sobre parser HTML WooCommerce con validacion sobre HTML real del proveedor.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/admin/admin-provider-search.parsers.ts`
  - `next-stack/apps/api/src/modules/admin/admin-provider-search.parsers.test.ts`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. Celuphone ahora levanta correctamente precios visibles en cards WooCommerce con moneda dentro de `bdi/span` anidados. PuntoCell sigue sin precio numerico porque el sitio publico expone `Consultar Precio` y `0.0` oculto, no un valor real de venta parseable.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - verificacion manual contra HTML real de `https://celuphone.com.ar/?s=modulo+a13&post_type=product&dgwt_wcas=1`
- Riesgos / notas:
  - para PuntoCell no hay fix confiable sin otra fuente de datos, sesion autenticada o endpoint interno con precio real
  - el cambio se concentro en el parser; no modifica ranking ni contratos del flujo de repuestos

---

### 2026-04-16 - Codex
- Alcance: pulir la busqueda de repuestos en reparaciones para que priorice precio mas bajo, bloquee seleccion de items sin stock y haga mas clara la carga visual.
- Tipo de intervencion: mejora funcional full-stack sobre ranking de resultados en backend y UX del flujo de repuestos en frontend.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/admin/admin-provider-search.service.ts`
  - `next-stack/apps/web/src/features/repairs/use-repair-provider-part-search.ts`
  - `next-stack/apps/web/src/features/repairs/use-repair-provider-part-pricing.ts`
  - `next-stack/apps/web/src/features/repairs/repair-provider-part-search-results.tsx`
  - `next-stack/apps/web/src/styles/admin.css`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. Los resultados de repuestos ahora se ordenan de menor precio a mayor, los items sin stock ya no se pueden elegir y la busqueda muestra un estado de progreso propio en lugar del loading generico. Tambien se redujo la altura visual de cada resultado para densificar la lista.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - el progreso de busqueda es una estimacion visual del proceso y no un porcentaje exacto por proveedor
  - los repuestos sin precio siguen quedando al final de la lista para no falsear el orden por costo real

---

### 2026-04-14 - Codex
- Alcance: normalizar el alta y edicion rapida del catalogo tecnico a mayusculas y pulir el modal de alta rapida del scope con animacion y backdrop global.
- Tipo de intervencion: mejora funcional full-stack sobre `admin/calculos/reparaciones` y persistencia canonica en backend.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/admin/admin.service.ts`
  - `next-stack/apps/api/src/modules/device-catalog/device-catalog.service.ts`
  - `next-stack/apps/api/src/modules/device-catalog/device-catalog.service.test.ts`
  - `next-stack/apps/web/src/features/admin/AdminRepairCalculationsHubPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-repair-calculations-hub.sections.tsx`
  - `next-stack/apps/web/src/styles/base.css`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. Los nombres nuevos de tipo, marca, grupo, modelo y falla ahora se escriben y se guardan en mayusculas desde la hub, y el backend refuerza esa regla para no depender de una sola pantalla. El popup de alta rapida ahora abre y cierra con transicion suave, bloquea scroll de fondo y usa un overlay global que cubre todo el viewport.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - los `prompt` nativos que siguen vivos en renombrados inline todavia no fueron reemplazados por modales propios
  - la normalizacion a mayusculas se endurecio en backend para `device type`, `brand`, `group`, `model` e `issue`, pero otras pantallas de texto libre fuera de este subdominio no se alteran

---

### 2026-04-14 - Codex
- Alcance: reemplazar el `prompt` nativo del alta rapida en el scope de reparaciones por un dialogo propio del admin y blindar el backend contra duplicados de modelos por nombre normalizado.
- Tipo de intervencion: mejora funcional full-stack en `device-catalog` + UX del frontend `admin/calculos/reparaciones`.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/device-catalog/device-catalog.service.ts`
  - `next-stack/apps/api/src/modules/device-catalog/device-catalog.service.test.ts`
  - `next-stack/apps/web/src/features/admin/AdminRepairCalculationsHubPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-devices-catalog.helpers.ts`
  - `next-stack/apps/web/src/features/admin/admin-repair-calculations-hub.sections.tsx`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. El alta rapida desde el scope ya no usa `prompt` del navegador; abre un dialogo visual consistente con la web. Ademas, crear o renombrar modelos equivalentes dentro de la misma marca ahora queda bloqueado tambien en backend, incluyendo variantes por mayusculas, minusculas, espacios o slugs historicos inconsistentes.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - el dialogo rapido reutiliza la logica del scope actual y por ahora no reemplaza los `prompt` de renombrado inline; solo corrige el alta rapida
  - la proteccion definitiva de duplicados vive ahora en backend, asi que el catalogo no depende solo del estado cargado en frontend

---

### 2026-04-14 - Codex
- Alcance: advertir y prevenir duplicados de modelos mientras se escribe el alta dentro del catalogo de dispositivos y la hub de calculos de reparaciones.
- Tipo de intervencion: mejora funcional de UX en frontend con heuristica de similitud compartida.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/admin-devices-catalog.helpers.ts`
  - `next-stack/apps/web/src/features/admin/admin-devices-catalog.helpers.test.ts`
  - `next-stack/apps/web/src/features/admin/AdminDevicesCatalogPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-devices-catalog.sections.tsx`
  - `next-stack/apps/web/src/features/admin/AdminRepairCalculationsHubPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-repair-calculations-hub.sections.tsx`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. Al escribir un modelo nuevo ahora se muestran coincidencias parecidas dentro de la marca activa y se bloquea el alta cuando la coincidencia es exacta.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - la deteccion de similitud es heuristica y prioriza evitar duplicados operativos comunes como `Note 13` vs `Note13`
  - el quick-add del dropdown sigue usando prompt nativo; ahi solo se bloquea el duplicado exacto porque no existe tipeo progresivo dentro del prompt

---

### 2026-04-14 - Codex
- Alcance: volver mas didactico el `Scope activo` de la hub de reparaciones para que cada select permita alta rapida del item faltante desde el propio dropdown.
- Tipo de intervencion: mejora funcional de UX en frontend `admin/calculos/reparaciones`.
- Archivos tocados:
  - `next-stack/apps/web/src/components/ui/custom-select.tsx`
  - `next-stack/apps/web/src/styles/base.css`
  - `next-stack/apps/web/src/features/admin/AdminRepairCalculationsHubPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-repair-calculations-hub.sections.tsx`
  - `next-stack/apps/web/src/features/deviceCatalog/api.ts`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. Al abrir los selects de `Tipo`, `Marca`, `Grupo`, `Modelo` y `Falla` dentro del scope ahora aparece una accion `+ Agregar ...` cuando falta el item buscado. Esa accion crea el item en el contexto correcto y lo deja seleccionado automaticamente dentro del mismo scope.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
- Riesgos / notas:
  - el alta rapida usa prompt nativo por ahora; prioriza velocidad de operacion sobre una modal custom
  - las acciones de `Marca`, `Grupo`, `Modelo` y `Falla` se habilitan solo cuando existe el contexto padre minimo necesario

---

### 2026-04-14 - Codex
- Alcance: centralizar la gestion del catalogo tecnico y del pricing de reparaciones en una hub unica, y volver explicita la marca activa usada para crear modelos.
- Tipo de intervencion: reorganizacion funcional del frontend `admin/repairs pricing` + ajuste puntual de backend `admin` para borrado seguro de tipos.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/{AdminRepairCalculationsHubPage.tsx,admin-repair-calculation-context.ts,admin-repair-calculation-context.test.ts,admin-repair-calculations-hub.sections.tsx,AdminCalculationsHubPage.tsx,AdminDeviceTypesPage.tsx,admin-device-types.sections.tsx,AdminDevicesCatalogPage.tsx,admin-devices-catalog.helpers.ts,admin-devices-catalog.helpers.test.ts,admin-devices-catalog.sections.tsx,AdminModelGroupsPage.tsx,admin-model-groups.sections.tsx,AdminRepairTypesPage.tsx,admin-repair-types.helpers.ts,admin-repair-types.helpers.test.ts,admin-repair-types.sections.tsx,AdminRepairPricingRulesPage.tsx,admin-repair-pricing-rules.sections.tsx,admin-repair-pricing-rules-row.tsx,AdminRepairPricingRuleCreatePage.tsx,AdminRepairPricingRuleEditPage.tsx,admin-repair-pricing-rule-form.helpers.ts,admin-repair-pricing-rule-form.helpers.test.ts,admin-repair-pricing-rule-form.sections.tsx,api.ts}`
  - `next-stack/apps/web/src/features/deviceCatalog/api.ts`
  - `next-stack/apps/web/src/App.tsx`
  - `next-stack/apps/web/src/app/routing/route-pages.tsx`
  - `next-stack/apps/web/src/features/admin/admin-dashboard-panels.tsx`
  - `next-stack/apps/api/src/modules/admin/{admin.controller.ts,admin.service.ts}`
  - `project-docs/{frontend/FRONTEND_MAP.md,backend/BACKEND_MAP.md,architecture/ARCHITECTURE.md,DECISIONS_LOG.md}`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. Ahora existe `/admin/calculos/reparaciones` como entrada central para `Tipo -> Marca -> Grupo -> Modelo`, `Falla por Tipo` y reglas de calculo. Las vistas especificas siguen vivas, pero reciben contexto por query string. En catalogo y en la hub, la marca usada para crear modelos deja de ser implicita: queda visible como `marca activa`, seleccionable desde la propia lista. Ademas, `device types` ya soporta borrado real cuando no tiene dependencias activas.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - la hub reutiliza endpoints existentes; si en el futuro crece mucho el volumen de catalogo, puede convenir sumar un endpoint agregado de lectura para hidratarla con menos roundtrips
  - el flujo de modelos ahora exige contexto explicito de marca; es deliberado para evitar altas ambiguas

---

### 2026-04-14 - Codex
- Alcance: agregar login con Google para clientes usando redirect OAuth backend + callback dedicado en frontend, con vinculacion por email y sin habilitar acceso social para admins.
- Tipo de intervencion: cambio funcional de backend `auth/prisma/contracts` + frontend `auth/router`.
- Archivos tocados:
  - `next-stack/apps/api/prisma/schema.prisma`
  - `next-stack/apps/api/prisma/migrations/20260414110000_add_google_subject_to_user/migration.sql`
  - `next-stack/apps/api/src/modules/auth/{auth.controller.ts,auth.service.ts,users.service.ts}`
  - `next-stack/apps/api/src/main.ts`
  - `next-stack/packages/contracts/src/index.ts`
  - `next-stack/.env.example`
  - `next-stack/.env.production.example`
  - `next-stack/apps/web/src/features/auth/{LoginPage.tsx,GoogleAuthCallbackPage.tsx,api.ts,google-auth.helpers.ts,google-auth.helpers.test.ts}`
  - `next-stack/apps/web/src/app/routing/{route-pages.tsx}`
  - `next-stack/apps/web/src/App.tsx`
  - `next-stack/apps/web/src/styles/auth.css`
  - `project-docs/{DECISIONS_LOG.md,architecture/ARCHITECTURE.md,frontend/FRONTEND_MAP.md,backend/BACKEND_MAP.md}`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. `LoginPage` ahora puede iniciar un redirect OAuth con Google para cuentas `USER`; el backend vincula por email cuando corresponde, crea usuarios Google cuando no existen, y rechaza acceso social para `ADMIN`. El frontend completa la sesion desde `/auth/google/callback` sin recibir tokens finales por query string.
- Validaciones ejecutadas:
  - `cmd /c npm run db:generate --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - el flujo completo con Google real requiere configurar `GOOGLE_OAUTH_*` antes de probar contra el proveedor
  - la validacion automatica cubre el wiring y las reglas de dominio; no sustituye una prueba manual con credenciales reales
  - en Windows, `prisma generate` puede chocar con un lock local del engine (`EPERM` al renombrar la DLL); si vuelve a ocurrir, hay que liberar el proceso que retiene el engine y regenerar antes de probar contra Google real

---

### 2026-04-14 - Codex
- Alcance: corregir el shell de auth para que el panel visual use solo la imagen real de branding y no una ilustracion armada con CSS, manteniendo el header alineado al shell publico.
- Tipo de intervencion: ajuste funcional controlado en frontend `auth`.
- Archivos tocados:
  - `next-stack/apps/web/src/features/auth/AuthLayout.tsx`
  - `next-stack/apps/web/src/styles/auth.css`
  - `project-docs/DECISIONS_LOG.md`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/architecture/ASSET_STRATEGY.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. El panel izquierdo de auth ya no compone blobs, waves ni shapes en CSS: ahora muestra la imagen desktop/mobile configurable desde branding, un overlay simple y el contenido textual encima. La banda mobile tambien queda mas compacta.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - si no hay asset configurado, `auth-visual` cae a un fondo simple de fallback
  - no se hizo inspeccion manual con navegador real; el ajuste visual se valido por smoke y revision de codigo

---

### 2026-04-13 - Codex
- Alcance: alinear el navbar de auth con la navbar real del sitio, corregir el responsive del login y separar el fondo visual del acceso en variantes desktop/mobile.
- Tipo de intervencion: ajuste funcional controlado en frontend `auth/app-shell/admin` + ampliacion menor del branding publico/backend.
- Archivos tocados:
  - `next-stack/apps/web/src/features/auth/AuthLayout.tsx`
  - `next-stack/apps/web/src/layouts/app-shell/mobile-sidebar.tsx`
  - `next-stack/apps/web/src/styles/auth.css`
  - `next-stack/apps/api/src/modules/admin/app-settings.registry.ts`
  - `next-stack/apps/api/src/modules/admin/app-settings.registry.test.ts`
  - `next-stack/apps/api/src/modules/store/store.service.ts`
  - `next-stack/apps/web/src/features/store/types.ts`
  - `next-stack/apps/web/src/features/admin/admin-visual-identity.helpers.ts`
  - `next-stack/apps/web/src/features/admin/admin-visual-identity.helpers.test.ts`
  - `next-stack/apps/web/src/features/admin/admin-visual-identity.sections.tsx`
  - `project-docs/DECISIONS_LOG.md`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/architecture/ASSET_STRATEGY.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. Auth ahora usa la misma gramática de header que la web general y el login mobile deja de depender de un topbar separado. El branding expone dos fondos configurables para auth (`desktop` y `mobile`) dentro de identidad visual, con fallback seguro al asset desktop cuando la variante mobile no exista.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - el smoke valida `/auth/login`, pero la calidad visual fina del responsive sigue siendo recomendable revisarla manualmente con viewport real
  - `MobileSidebar` ahora soporta ocultar el link de login cuando la vista actual ya es `/auth/login`

---

### 2026-04-13 - Codex
- Alcance: volver administrable desde branding el fondo visual del login y compactar el flujo de acceso para que entre mejor en desktop sin scroll externo.
- Tipo de intervencion: ajuste funcional controlado en backend `admin/store` + refactor visual puntual del frontend `auth/admin`.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/admin/app-settings.registry.ts`
  - `next-stack/apps/api/src/modules/admin/app-settings.registry.test.ts`
  - `next-stack/apps/api/src/modules/store/store.service.ts`
  - `next-stack/apps/web/src/features/store/types.ts`
  - `next-stack/apps/web/src/features/admin/admin-visual-identity.helpers.ts`
  - `next-stack/apps/web/src/features/admin/admin-visual-identity.helpers.test.ts`
  - `next-stack/apps/web/src/features/admin/admin-visual-identity.sections.tsx`
  - `next-stack/apps/web/src/features/auth/AuthLayout.tsx`
  - `next-stack/apps/web/src/features/auth/LoginPage.tsx`
  - `next-stack/apps/web/src/styles/auth.css`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/architecture/ASSET_STRATEGY.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. El admin ahora puede subir/restaurar el fondo visual del login desde identidad visual. `AuthLayout` consume ese asset desde `/store/branding` y login se compacta para entrar mejor en desktop, manteniendo el registro solo como recomendacion dentro de la propia vista.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - si no se configura imagen, auth sigue usando el fallback abstracto actual
  - la compactacion prioriza desktop; mobile mantiene el layout en columna unica con banda visual superior

---

### 2026-04-13 - Codex
- Alcance: rediseñar la experiencia visual de auth para alinearla a una composicion de dos paneles, con topbar publica liviana y escena propia de acceso.
- Tipo de intervencion: refactor visual/UX del frontend `auth` sin cambios en rutas, APIs ni contratos de componentes globales.
- Archivos tocados:
  - `next-stack/apps/web/src/features/auth/AuthLayout.tsx`
  - `next-stack/apps/web/src/features/auth/LoginPage.tsx`
  - `next-stack/apps/web/src/features/auth/RegisterPage.tsx`
  - `next-stack/apps/web/src/features/auth/ForgotPasswordPage.tsx`
  - `next-stack/apps/web/src/features/auth/ResetPasswordPage.tsx`
  - `next-stack/apps/web/src/features/auth/VerifyEmailPage.tsx`
  - `next-stack/apps/web/src/features/auth/BootstrapAdminPage.tsx`
  - `next-stack/apps/web/src/styles.css`
  - `next-stack/apps/web/src/styles/auth.css`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si, menor. Se mantiene el flujo de login, alta, reset, verificacion y bootstrap, pero auth pasa a tener un shell visual propio con escena de dos paneles, topbar publica coherente y cards de acceso adaptadas a ese nuevo escenario. El registro sigue apareciendo solo como recomendacion desde login.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - el cambio esta encapsulado en `auth.css` para no contaminar el styling global del resto del sitio
  - `BootstrapAdminPage` hereda el shell base de auth, pero sin un tratamiento visual especial fuera de esa consistencia compartida

---

### 2026-04-13 - Codex
- Alcance: limpiar el acceso publico para dejar un solo CTA de login, quitar la promocion global de registro y ordenar visualmente las vistas de auth con una navbar publica liviana.
- Tipo de intervencion: ajuste funcional controlado del frontend `auth` + simplificacion del estado no autenticado del shell publico.
- Archivos tocados:
  - `next-stack/apps/web/src/features/auth/AuthLayout.tsx`
  - `next-stack/apps/web/src/features/auth/LoginPage.tsx`
  - `next-stack/apps/web/src/features/auth/RegisterPage.tsx`
  - `next-stack/apps/web/src/features/auth/VerifyEmailPage.tsx`
  - `next-stack/apps/web/src/App.tsx`
  - `next-stack/apps/web/src/layouts/AppShell.tsx`
  - `next-stack/apps/web/src/layouts/app-shell/mobile-sidebar.tsx`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. Los usuarios no autenticados ahora ven un solo CTA publico de login, `Crear cuenta` deja de aparecer en accesos globales, login pasa a recomendar registro desde la propia vista y auth gana una topbar publica visible con navegacion base. `VerifyEmailPage` ya no deriva a registro desde el estado sin contexto.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - el registro sigue publico por ruta, pero deja de promocionarse fuera de login por decision deliberada de UX
  - `AuthLayout` ahora depende de branding publico para mostrar marca y logo, con fallback seguro cuando la carga falla

---

### 2026-04-13 - Codex
- Alcance: habilitar borrado real en el catalogo tecnico de dispositivos para marcas, modelos y fallas, con confirmacion en UI y guardas de backend cuando existan referencias activas.
- Tipo de intervencion: ajuste funcional controlado en frontend `admin` + endurecimiento del backend `device-catalog`.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/AdminDevicesCatalogPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-devices-catalog.sections.tsx`
  - `next-stack/apps/api/src/modules/device-catalog/device-catalog.service.ts`
  - `next-stack/apps/api/src/modules/device-catalog/device-catalog.service.test.ts`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. El admin ahora muestra la accion `Eliminar` en marcas, modelos y fallas. El borrado pide confirmacion y solo se ejecuta si el item no esta en uso por reparaciones o reglas de precio; si hay relaciones activas, el backend responde con un mensaje legible y la recomendacion implicita sigue siendo desactivar cuando no corresponde borrar historico.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - el borrado sigue siendo deliberadamente mas restrictivo que desactivar, para no dejar referencias logicas colgadas en `repairs` o `repairPricingRules`
  - la UI de catalogo tecnico queda alineada con las capacidades reales del backend y deja de ocultar el flujo de eliminacion

---

### 2026-04-13 - Codex
- Alcance: cierre de la segunda ola de refinamiento del frontend despues del seccionado principal.
- Tipo de intervencion: refactor interno seguro de wrappers visuales y hooks del frontend para dejar fronteras publicas mas finas y panels/hooks especializados.
- Archivos tocados:
  - `next-stack/apps/web/src/features/orders/{admin-orders.sections.tsx,admin-orders-counters.tsx,admin-orders-detail-panel.tsx,admin-orders-row.tsx,admin-quick-sales.sections.tsx,admin-quick-sales-search.tsx,admin-quick-sales-ticket.tsx}`
  - `next-stack/apps/web/src/features/repairs/{repair-provider-part-pricing-section.search.tsx,repair-provider-part-search-controls.tsx,repair-provider-part-search-results.tsx,repair-provider-part-selected-summary.tsx,use-admin-repair-create.ts,use-admin-repair-create-catalog.ts,use-admin-repair-create-pricing.ts}`
  - `next-stack/apps/web/src/features/providers/{admin-providers.sections.tsx,admin-providers-panels.tsx}`
  - `next-stack/apps/web/src/features/admin/{admin-dashboard.sections.tsx,admin-dashboard-panels.tsx,admin-product-pricing-rules.sections.tsx,admin-product-pricing-rules.fields.tsx,admin-product-pricing-rules-panels.tsx,admin-repair-pricing-rules.sections.tsx,admin-repair-pricing-rules.controls.tsx,admin-repair-pricing-rules-row.tsx,admin-store-hero-settings.sections.tsx,admin-store-hero-settings.assets.tsx,admin-store-hero-settings.form.tsx}`
  - `next-stack/apps/web/src/features/catalogAdmin/{admin-products.sections.tsx,admin-products-panels.tsx,admin-product-edit.sections.tsx,admin-product-edit-panels.tsx}`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantiene el mismo comportamiento visible; cambia la segmentacion interna y se sanea copy/estructura en algunos bloques operativos.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - con esta tanda se da por cerrada la segunda ola de refinamiento: ya no quedan paginas o `sections.tsx` claramente monoliticos pendientes
  - lo que sigue grande en frontend ya es complejidad terminal de paneles o hooks de dominio, no deuda obvia de seccionado

---

### 2026-04-13 - Codex
- Alcance: refinamiento visual del alta admin de reparaciones para cerrar el hotspot que seguia dentro de `sections.tsx`.
- Tipo de intervencion: refactor interno seguro del frontend `repairs`, separando panels visuales del alta y saneando copy del feature.
- Archivos tocados:
  - `next-stack/apps/web/src/features/repairs/{AdminRepairCreatePage.tsx,admin-repair-create.sections.tsx,admin-repair-create-basic-panel.tsx,admin-repair-create-diagnosis-panel.tsx,admin-repair-create-submit-panel.tsx}`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantiene el mismo flujo de alta admin; cambia solo la separacion interna de los bloques visuales y se normaliza el copy visible del feature.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - `repairs` queda mas parejo entre create y detail tambien a nivel visual; lo siguiente ya no es seccionado pendiente sino refinamiento de otros shells o `sections.tsx` deliberadamente densos
  - la frontera publica del feature se mantiene estable: page + hook + sections siguen exportando igual hacia el resto del modulo

---

### 2026-04-13 - Codex
- Alcance: refinamiento visual del detalle admin de reparaciones para cerrar el hotspot que seguia dentro de `sections.tsx`.
- Tipo de intervencion: refactor interno seguro del frontend `repairs`, separando panels visuales sin tocar hooks ni contratos del feature.
- Archivos tocados:
  - `next-stack/apps/web/src/features/repairs/{admin-repair-detail.sections.tsx,admin-repair-detail-status-panels.tsx,admin-repair-detail-pricing-panels.tsx,admin-repair-detail-sidebar.tsx}`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantiene el mismo flujo del detalle admin; cambia solo la separacion interna de los bloques visuales de estado, pricing sugerido e informacion lateral.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - `AdminRepairDetailPage.tsx` ya no depende de un unico `sections.tsx` tan cargado, pero el siguiente refinamiento razonable dentro de `repairs` pasa por `admin-repair-create.sections.tsx`
  - la frontera publica del feature se mantiene estable: page + hook + sections siguen exportando igual hacia el resto del modulo

---

### 2026-04-13 - Codex
- Alcance: segunda ola de refinamiento sobre el flujo tecnico de proveedor + repuesto en `repairs`.
- Tipo de intervencion: refactor interno seguro del hotspot principal del frontend para separar busqueda de proveedores de preview/snapshot.
- Archivos tocados:
  - `next-stack/apps/web/src/features/repairs/{use-repair-provider-part-pricing.ts,use-repair-provider-part-search.ts,repair-provider-part-pricing-section.helpers.ts,repair-provider-part-pricing-section.helpers.test.ts}`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantiene el mismo flujo de busqueda, seleccion, preview y aplicacion del snapshot; cambia la separacion interna entre busqueda agregada e inteligencia de preview.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el hotspot sigue siendo complejo por naturaleza del dominio, pero ahora la frontera entre seleccion de proveedor y calculo tecnico es mucho mas clara
  - el siguiente frente con mejor retorno ya no es este hook, sino shells o `sections.tsx` que siguen densos dentro de `repairs`

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

### 2026-04-01 - Codex
- Alcance: segunda ola de refinamiento sobre el shell admin de alta de reparaciones.
- Tipo de intervencion: refactor interno seguro para mover la orquestacion a un hook dedicado.
- Archivos tocados:
  - `next-stack/apps/web/src/features/repairs/{AdminRepairCreatePage.tsx,use-admin-repair-create.ts}`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantiene la misma ruta, los mismos requests, la misma estructura visual y el mismo wiring con pricing suggestion y snapshot. Cambia solo la distribucion interna entre shell y hook.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - detail y create quedan alineados con el mismo patron de refinamiento
  - dentro de `repairs`, el siguiente candidato natural de segunda ola ya no es una pagina de alta/detalle sino `AppShell.tsx` o algun `sections.tsx` pesado

---

### 2026-04-01 - Codex
- Alcance: segunda ola de refinamiento sobre el shell admin de detalle de reparaciones.
- Tipo de intervencion: refactor interno seguro para mover la orquestacion a un hook dedicado.
- Archivos tocados:
  - `next-stack/apps/web/src/features/repairs/{AdminRepairDetailPage.tsx,use-admin-repair-detail.ts}`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantiene la misma ruta, los mismos requests, la misma estructura visual y el mismo wiring con pricing suggestion y snapshot. Cambia solo la distribucion interna entre shell y hook.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el seccionado ya esta cerrado; esta ola ya es refinamiento de shells grandes
  - dentro de `repairs`, los siguientes candidatos naturales de segunda ola son `AdminRepairCreatePage.tsx` y `AppShell.tsx`

---

### 2026-04-01 - Codex
- Alcance: segunda ola de refinamiento sobre el flujo tecnico de proveedor + repuesto en `repairs`.
- Tipo de intervencion: refactor interno seguro para mover estado async y derivado a un hook dedicado.
- Archivos tocados:
  - `next-stack/apps/web/src/features/repairs/{RepairProviderPartPricingSection.tsx,use-repair-provider-part-pricing.ts,repair-provider-part-pricing-section.search.tsx,repair-provider-part-pricing-section.preview.tsx}`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantiene la misma interfaz publica de la seccion, los mismos requests y la misma interaccion de snapshot/preview; cambia la distribucion interna entre shell, hook y subcomponentes. Como mejora menor, el copy del feature queda en ASCII consistente y deja de arrastrar mojibake.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el frente de seccionado ya no tiene paginas pendientes; lo que sigue es refinamiento sobre bloques grandes ya estructurados
  - `repairs` queda mas ordenado, pero aun existen candidatos de segunda ola como `AdminRepairDetailPage.tsx`, `AdminRepairCreatePage.tsx` y `AppShell.tsx`

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

### 2026-03-31 - Codex
- Alcance: partir `AdminStoreHeroSettingsPage` en helpers y sections, dejando la pagina principal como orquestador de la portada visual de la tienda.
- Tipo de intervencion: refactor interno seguro del frontend admin + seccionado del feature de hero/storefront sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/AdminStoreHeroSettingsPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-store-hero-settings.helpers.ts`
  - `next-stack/apps/web/src/features/admin/admin-store-hero-settings.helpers.test.ts`
  - `next-stack/apps/web/src/features/admin/admin-store-hero-settings.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen carga/guardado de textos, upload/reset de imagenes, preview y control del degradado; cambia la separacion interna entre fetch/sync, helpers puros y bloques visuales. Tambien se corrigen textos dañados del feature a una version ASCII consistente.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el area visual del admin queda mas clara, pero todavia siguen pendientes hotspots como `AdminAutoReportsPage.tsx` y otras pantallas grandes especificas del admin
  - el split mantiene `adminSettingsApi` y `brandAssetsApi` como fronteras unicas del feature y no introduce estado global nuevo

---

### 2026-03-31 - Codex
- Alcance: partir `AdminAutoReportsPage` en helpers y sections, dejando la pagina principal como orquestador de reportes semanales y alertas operativas.
- Tipo de intervencion: refactor interno seguro del frontend admin + seccionado del feature de reportes sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/AdminAutoReportsPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-auto-reports.helpers.ts`
  - `next-stack/apps/web/src/features/admin/admin-auto-reports.helpers.test.ts`
  - `next-stack/apps/web/src/features/admin/admin-auto-reports.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen carga/guardado de configuracion, envios manuales y limpieza del historial; cambia la separacion interna entre fetch/sync, helpers puros y bloques visuales.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el feature de reportes queda mas claro y mantenible, pero todavia siguen pendientes otras pantallas admin grandes como `AdminVisualIdentityPage.tsx`
  - el split mantiene `adminSettingsApi` y `adminApi` como fronteras unicas del feature y no introduce estado global nuevo

---

### 2026-03-31 - Codex
- Alcance: partir `AdminVisualIdentityPage` en helpers y sections, dejando la pagina principal como orquestador de identidades, favicons, iconos y logos.
- Tipo de intervencion: refactor interno seguro del frontend admin + seccionado del feature visual sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/AdminVisualIdentityPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-visual-identity.helpers.ts`
  - `next-stack/apps/web/src/features/admin/admin-visual-identity.helpers.test.ts`
  - `next-stack/apps/web/src/features/admin/admin-visual-identity.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen upload/reset de assets, previews y estado por slot; cambia la separacion interna entre fetch/sync, helpers puros y bloques visuales. Tambien se corrigen textos dañados del feature y el preview de archivos temporales ahora limpia sus `objectURL`.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el subdominio visual del admin queda mucho mas consistente, pero todavia siguen pendientes otras pantallas grandes fuera de branding como `AdminBusinessSettingsPage.tsx`
  - el split mantiene `brandAssetsApi` y `adminSettingsApi` como fronteras unicas del feature y no introduce estado global nuevo

---

### 2026-03-31 - Codex
- Alcance: partir `AdminBusinessSettingsPage` en helpers y sections, dejando la pagina principal como orquestador de la configuracion base del negocio.
- Tipo de intervencion: refactor interno seguro del frontend admin + seccionado del feature de business settings sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/AdminBusinessSettingsPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-business-settings.helpers.ts`
  - `next-stack/apps/web/src/features/admin/admin-business-settings.helpers.test.ts`
  - `next-stack/apps/web/src/features/admin/admin-business-settings.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen la carga/guardado de datos del negocio, el resumen lateral, las alertas operativas y la configuracion de portada; cambia la separacion interna entre fetch/sync, helpers puros y bloques visuales.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el feature de business settings queda bastante mas claro, pero todavia siguen pendientes otras pantallas grandes como `AdminWarrantyCreatePage.tsx`
  - el split mantiene `adminSettingsApi` como frontera unica del feature y no introduce estado global nuevo

---

### 2026-03-31 - Codex
- Alcance: partir `AdminWarrantyCreatePage` en helpers y sections, dejando la pagina principal como orquestador del alta de garantias.
- Tipo de intervencion: refactor interno seguro del frontend operativo + seccionado del feature `warranties` sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/warranties/AdminWarrantyCreatePage.tsx`
  - `next-stack/apps/web/src/features/warranties/admin-warranty-create.helpers.ts`
  - `next-stack/apps/web/src/features/warranties/admin-warranty-create.helpers.test.ts`
  - `next-stack/apps/web/src/features/warranties/admin-warranty-create.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen la carga de reparaciones, proveedores y productos, el autocompletado de costo/origen y el guardado del incidente; cambia la separacion interna entre fetch/sync, helpers puros y secciones de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - `warranties` gana una frontera mucho mas clara, pero todavia siguen pendientes pantallas grandes como `AdminDevicesCatalogPage.tsx` y `AdminOrderDetailPage.tsx`
  - el split mantiene `adminApi`, `repairsApi` y `catalogAdminApi` como fronteras unicas del feature y no introduce estado global nuevo

---

### 2026-03-31 - Codex
- Alcance: partir `AdminDevicesCatalogPage` en helpers y sections, dejando la pagina principal como orquestador del catalogo tecnico.
- Tipo de intervencion: refactor interno seguro del frontend admin tecnico + seccionado del feature de dispositivos sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/AdminDevicesCatalogPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-devices-catalog.helpers.ts`
  - `next-stack/apps/web/src/features/admin/admin-devices-catalog.helpers.test.ts`
  - `next-stack/apps/web/src/features/admin/admin-devices-catalog.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen filtros por tipo/marca y mutaciones de alta, rename y toggle sobre marcas, modelos y fallas; cambia la separacion interna entre fetch/sync, helpers puros y bloques de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el catalogo tecnico queda mucho mas claro, pero todavia siguen pendientes pantallas grandes como `AdminOrderDetailPage.tsx` y `AdminRepairPricingRuleEditPage.tsx`
  - el split mantiene `adminApi` y `deviceCatalogApi` como fronteras unicas del feature y no introduce estado global nuevo

---

### 2026-03-31 - Codex
- Alcance: partir `AdminOrderDetailPage` en helpers y sections, dejando la pagina principal como orquestador del detalle admin de pedidos.
- Tipo de intervencion: refactor interno seguro del frontend operativo + seccionado del feature `orders` sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/orders/AdminOrderDetailPage.tsx`
  - `next-stack/apps/web/src/features/orders/admin-order-detail.helpers.ts`
  - `next-stack/apps/web/src/features/orders/admin-order-detail.helpers.test.ts`
  - `next-stack/apps/web/src/features/orders/admin-order-detail.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen la carga del pedido, el cambio de estado, el seguimiento visual, la impresion/ticket y el resumen operativo; cambia la separacion interna entre fetch/sync, helpers puros y secciones de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el detalle admin de pedidos queda mucho mas claro, pero todavia siguen pendientes pantallas grandes como `AdminRepairPricingRuleEditPage.tsx` y `AdminModelGroupsPage.tsx`
  - el split mantiene `ordersApi` como frontera unica del feature y no introduce estado global nuevo

---

### 2026-03-31 - Codex
- Alcance: compartir la base del formulario entre `AdminRepairPricingRuleCreatePage` y `AdminRepairPricingRuleEditPage`, y partir `AdminModelGroupsPage` en helpers y sections.
- Tipo de intervencion: refactor interno seguro del frontend admin tecnico + consolidacion de formularios gemelos sin abrir APIs nuevas.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/AdminRepairPricingRuleCreatePage.tsx`
  - `next-stack/apps/web/src/features/admin/AdminRepairPricingRuleEditPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-repair-pricing-rule-form.helpers.ts`
  - `next-stack/apps/web/src/features/admin/admin-repair-pricing-rule-form.helpers.test.ts`
  - `next-stack/apps/web/src/features/admin/admin-repair-pricing-rule-form.sections.tsx`
  - `next-stack/apps/web/src/features/admin/AdminModelGroupsPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-model-groups.helpers.ts`
  - `next-stack/apps/web/src/features/admin/admin-model-groups.helpers.test.ts`
  - `next-stack/apps/web/src/features/admin/admin-model-groups.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen el alta/edicion de reglas de pricing puntual y la administracion de grupos de modelos; cambia la separacion interna entre fetch/sync, helpers puros y secciones de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el admin tecnico queda bastante mas consistente, pero todavia siguen pendientes pantallas grandes como `AdminWhatsappPage.tsx` y `AdminWarrantiesPage.tsx`
  - el split mantiene `adminApi`, `deviceCatalogApi` y `repairsApi` como fronteras unicas de estos features y no introduce estado global nuevo

---

### 2026-03-31 - Codex
- Alcance: partir `AdminProductCreatePage` en helpers y sections, dejando la pagina principal como orquestador del alta de catalogo comercial.
- Tipo de intervencion: refactor interno seguro del frontend `catalogAdmin` + seccionado del alta de productos sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/catalogAdmin/AdminProductCreatePage.tsx`
  - `next-stack/apps/web/src/features/catalogAdmin/admin-product-create.helpers.ts`
  - `next-stack/apps/web/src/features/catalogAdmin/admin-product-create.helpers.test.ts`
  - `next-stack/apps/web/src/features/catalogAdmin/admin-product-create.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen la carga de categorias/proveedores, la recomendacion de pricing, el preview de imagen y el alta del producto; cambia la separacion interna entre fetch/sync, helpers puros y bloques de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el catalogo comercial queda mas consistente, pero todavia siguen pendientes pantallas grandes como `AdminWarrantiesPage.tsx` y `AdminWhatsappPage.tsx`
  - el split mantiene `adminApi`, `catalogAdminApi` y `productPricingApi` como fronteras unicas del feature y no introduce estado global nuevo

---

### 2026-03-31 - Codex
- Alcance: partir `AdminWarrantiesPage` en helpers y sections, dejando la pagina principal como orquestador del listado admin de garantias.
- Tipo de intervencion: refactor interno seguro del frontend `warranties` + seccionado del listado operativo sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/warranties/AdminWarrantiesPage.tsx`
  - `next-stack/apps/web/src/features/warranties/admin-warranties.helpers.ts`
  - `next-stack/apps/web/src/features/warranties/admin-warranties.helpers.test.ts`
  - `next-stack/apps/web/src/features/warranties/admin-warranties.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen el fetch del listado, los filtros manuales, el top de proveedores y el cierre de incidentes; cambia la separacion interna entre fetch/sync, helpers puros y bloques de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el subdominio `warranties` queda mas consistente, pero todavia siguen pendientes pantallas grandes como `AdminWhatsappPage.tsx` y `CheckoutPage.tsx`
  - el split mantiene `adminApi` como frontera unica del feature y no introduce estado global nuevo

---

### 2026-03-31 - Codex
- Alcance: partir `AdminWhatsappPage` en helpers y sections, dejando la pagina principal como orquestador del admin de templates y logs.
- Tipo de intervencion: refactor interno seguro del frontend `admin/communications` + seccionado de WhatsApp sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/AdminWhatsappPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-whatsapp.helpers.ts`
  - `next-stack/apps/web/src/features/admin/admin-whatsapp.helpers.test.ts`
  - `next-stack/apps/web/src/features/admin/admin-whatsapp.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen la carga y guardado de plantillas, las variables disponibles y los logs recientes; cambia la separacion interna entre fetch/sync, helpers puros y bloques de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el admin de comunicaciones queda mas consistente, pero todavia siguen pendientes pantallas grandes como `CheckoutPage.tsx` y `MyAccountPage.tsx`
  - el split mantiene `whatsappApi` y `whatsapp-ui` como fronteras unicas del feature y no introduce estado global nuevo

---

### 2026-03-31 - Codex
- Alcance: partir `CheckoutPage` en helpers y sections, dejando la pagina principal como orquestador del flujo de compra.
- Tipo de intervencion: refactor interno seguro del frontend `orders/store` + seccionado del checkout sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/orders/CheckoutPage.tsx`
  - `next-stack/apps/web/src/features/orders/checkout.helpers.ts`
  - `next-stack/apps/web/src/features/orders/checkout.helpers.test.ts`
  - `next-stack/apps/web/src/features/orders/checkout.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen el quote del carrito, la seleccion de pago, la confirmacion del pedido y la limpieza del carrito; cambia la separacion interna entre fetch/sync, helpers puros y bloques de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el flujo de compra queda mas consistente, pero todavia siguen pendientes pantallas grandes como `MyAccountPage.tsx` y `CartPage.tsx`
  - el split mantiene `quoteCart`, `cartStorage`, `authStorage` y `ordersApi` como fronteras unicas del feature y no introduce estado global nuevo

---

### 2026-03-31 - Codex
- Alcance: partir `MyAccountPage` en helpers y sections, dejando la pagina principal como orquestador de perfil y seguridad.
- Tipo de intervencion: refactor interno seguro del frontend `auth/account` + seccionado de la cuenta autenticada sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/auth/MyAccountPage.tsx`
  - `next-stack/apps/web/src/features/auth/my-account.helpers.ts`
  - `next-stack/apps/web/src/features/auth/my-account.helpers.test.ts`
  - `next-stack/apps/web/src/features/auth/my-account.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen la carga del perfil, el guardado de nombre/email, la sincronizacion con `authStorage`, el cambio de contrasena y el preview token de verificacion; cambia la separacion interna entre fetch/sync, helpers puros y bloques de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el flujo autenticado de cuenta queda mas consistente, pero todavia siguen pendientes pantallas grandes como `CartPage.tsx` y `StoreProductDetailPage.tsx`
  - el split mantiene `authApi` y `authStorage` como fronteras unicas del feature y no introduce estado global nuevo

---

### 2026-03-31 - Codex
- Alcance: partir `CartPage` en helpers y sections, dejando la pagina principal como orquestador del carrito publico.
- Tipo de intervencion: refactor interno seguro del frontend `cart/store` + seccionado del carrito sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/cart/CartPage.tsx`
  - `next-stack/apps/web/src/features/cart/cart.helpers.ts`
  - `next-stack/apps/web/src/features/cart/cart.helpers.test.ts`
  - `next-stack/apps/web/src/features/cart/cart.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen la cotizacion del carrito, la normalizacion de items validos, la deteccion de stock insuficiente y la navegacion al checkout; cambia la separacion interna entre fetch/sync, helpers puros y bloques de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el flujo publico de compra queda mas consistente, pero todavia siguen pendientes pantallas grandes como `StoreProductDetailPage.tsx` y `AdminRepairsListPage.tsx`
  - el split mantiene `quoteCart` y `useCartItems` como fronteras unicas del feature y no introduce estado global nuevo

---

### 2026-03-31 - Codex
- Alcance: partir `StoreProductDetailPage` en helpers y sections, dejando la pagina principal como orquestador del detalle publico.
- Tipo de intervencion: refactor interno seguro del frontend `store/detail` + seccionado del detalle de producto sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/store/StoreProductDetailPage.tsx`
  - `next-stack/apps/web/src/features/store/store-product-detail.helpers.ts`
  - `next-stack/apps/web/src/features/store/store-product-detail.helpers.test.ts`
  - `next-stack/apps/web/src/features/store/store-product-detail.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen la carga del producto, la gestion de cantidad segun stock, el alta al carrito y las rutas de retorno/ayuda; cambia la separacion interna entre fetch/sync, helpers puros y bloques de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el storefront queda mas consistente, pero todavia siguen pendientes pantallas grandes como `AdminRepairsListPage.tsx` y `AdminWhatsappOrdersPage.tsx`
  - el split mantiene `storeApi` y `cartStorage` como fronteras unicas del feature y no introduce estado global nuevo

---

### 2026-04-01 - Codex
- Alcance: partir `AdminRepairsListPage` en helpers y sections, dejando la pagina principal como orquestador del listado tecnico.
- Tipo de intervencion: refactor interno seguro del frontend `repairs/admin` + seccionado de la mesa operativa sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/repairs/AdminRepairsListPage.tsx`
  - `next-stack/apps/web/src/features/repairs/admin-repairs-list.helpers.ts`
  - `next-stack/apps/web/src/features/repairs/admin-repairs-list.helpers.test.ts`
  - `next-stack/apps/web/src/features/repairs/admin-repairs-list.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen el fetch del listado admin, los filtros por texto/estado, las metricas operativas y el acceso al detalle; cambia la separacion interna entre fetch/sync, helpers puros y bloques de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el subdominio `repairs` queda mas consistente, pero todavia siguen pendientes pantallas como `AdminWhatsappOrdersPage.tsx` y `AdminAccountingPage.tsx`
  - el split mantiene `repairsApi` como frontera unica del feature y no introduce estado global nuevo

---

### 2026-04-01 - Codex
- Alcance: partir `AdminWhatsappOrdersPage` en helpers y sections, dejando la pagina principal como orquestador del canal WhatsApp para pedidos.
- Tipo de intervencion: refactor interno seguro del frontend `admin/communications` + seccionado del canal `orders` sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/AdminWhatsappOrdersPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-whatsapp-orders.helpers.ts`
  - `next-stack/apps/web/src/features/admin/admin-whatsapp-orders.helpers.test.ts`
  - `next-stack/apps/web/src/features/admin/admin-whatsapp-orders.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen la carga y guardado de plantillas del canal `orders`, las variables disponibles y los logs recientes; cambia la separacion interna entre fetch/sync, helpers puros y bloques de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el subdominio de comunicaciones queda mas consistente, pero todavia siguen pendientes pantallas como `AdminAccountingPage.tsx` y `Admin2faSecurityPage.tsx`
  - el split mantiene `whatsappApi` y `whatsapp-ui` como fronteras unicas del feature y no introduce estado global nuevo

---

### 2026-04-01 - Codex
- Alcance: partir `AdminAccountingPage` en helpers y sections, dejando la pagina principal como orquestador del libro contable.
- Tipo de intervencion: refactor interno seguro del frontend `accounting/admin` + seccionado del panel contable sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/accounting/AdminAccountingPage.tsx`
  - `next-stack/apps/web/src/features/accounting/admin-accounting.helpers.ts`
  - `next-stack/apps/web/src/features/accounting/admin-accounting.helpers.test.ts`
  - `next-stack/apps/web/src/features/accounting/admin-accounting.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen el fetch del libro contable, los filtros por texto/direccion/categoria/rango y la tabla operativa; cambia la separacion interna entre fetch/sync, helpers puros y bloques de UI.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el admin operativo queda mas consistente, pero todavia siguen pendientes pantallas como `Admin2faSecurityPage.tsx` y `AdminUsersPage.tsx`
  - el split mantiene `adminApi.accounting()` como frontera unica del feature y no introduce estado global nuevo

---

### 2026-04-01 - Codex
- Alcance: partir `Admin2faSecurityPage` en helpers y sections, dejando la pagina principal como orquestador del flujo 2FA admin.
- Tipo de intervencion: refactor interno seguro del frontend `admin/security` + seccionado del setup de doble factor sin abrir una API nueva.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/Admin2faSecurityPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-2fa-security.helpers.ts`
  - `next-stack/apps/web/src/features/admin/admin-2fa-security.helpers.test.ts`
  - `next-stack/apps/web/src/features/admin/admin-2fa-security.sections.tsx`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen la carga del estado 2FA, la generacion del secreto, la activacion/desactivacion y la copia de la URL `otpauth`; cambia la separacion interna entre fetch/sync, helpers puros y bloques de UI. Como mejora menor, el input TOTP ahora normaliza a 6 digitos numericos antes de enviar.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el admin de configuracion queda mas consistente, pero todavia siguen pendientes pantallas como `AdminUsersPage.tsx` y `AdminHelpFaqPage.tsx`
  - el split mantiene `adminSecurityApi` como frontera unica del feature y no introduce estado global nuevo

---

### 2026-04-01 - Codex
- Alcance: refinamiento transversal del shell global para bajar la orquestacion local de `AppShell`.
- Tipo de intervencion: refactor interno seguro del layout compartido con hook dedicado y helpers puros testeables.
- Archivos tocados:
  - `next-stack/apps/web/src/layouts/AppShell.tsx`
  - `next-stack/apps/web/src/layouts/app-shell/{helpers.ts,helpers.test.ts,use-app-shell.ts}`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen rutas, branding visible, menu de cuenta, sidebar mobile y footer; cambia solo la separacion interna entre composicion visual, estado derivado y listeners globales.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - `AppShell` deja de concentrar la orquestacion transversal y queda mas alineado con el patron shell + hook + helpers
  - la siguiente ola razonable ya no esta en paginas pendientes, sino en seguir afinando shells grandes o `sections.tsx` deliberadamente densos

---

### 2026-04-15 - Codex
- Alcance: corregir la busqueda agregada de repuestos para que el precio muestre el valor final visible del proveedor, sincronizar defaults persistidos de proveedores y exponer trazabilidad visible por proveedor en el flujo de reparaciones.
- Tipo de intervencion: correccion funcional backend + ajuste UX frontend + cobertura de tests.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/admin/{admin-provider-search.parsers.ts,admin-provider-search.parsers.test.ts,admin-provider-search.service.ts,admin-provider-registry.service.ts,admin-provider-registry.service.test.ts,admin-provider-search.text.ts}`
  - `next-stack/apps/web/src/features/repairs/{repair-provider-part-search-results.tsx,use-repair-provider-part-pricing.ts}`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. `repairs` ahora muestra el estado de cada proveedor consultado aunque no haya resultados utilizables, `Tienda Movil Rosario` prioriza el precio final visible sobre el tachado, `El Reparador de PC` deja de raspar HTML y usa su JSON API publica, y la configuracion default de proveedores se realinea automaticamente por nombre al iniciar una busqueda o probe.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - `importDefaultProviders()` ahora se ejecuta en caliente desde `AdminProviderSearchService`; si la base tiene overrides manuales intencionales en endpoints/defaults, esta tarea los va a normalizar contra el catalogo canonico por nombre.
  - El parser sigue teniendo una capa generica, pero los proveedores reportados quedaron cubiertos con pruebas especificas para evitar que vuelvan a colarse precios tachados, SKU o porcentajes como precio final.

---

### 2026-04-15 - Codex
- Alcance: reordenar la busqueda agregada de repuestos para consultar solo proveedores reales, endurecer matching exacto y simplificar la UI operativa del flujo de reparaciones.
- Tipo de intervencion: ajuste funcional backend + frontend con cambio de modelo menor (`Supplier.searchInRepairs`) y sincronizacion de catalogo default de proveedores.
- Archivos tocados:
  - `next-stack/apps/api/prisma/{schema.prisma,migrations/20260415103000_add_supplier_search_in_repairs/migration.sql}`
  - `next-stack/apps/api/src/modules/admin/{admin-provider-registry.service.ts,admin-provider-registry.service.test.ts,admin-provider-search.service.ts,admin-provider-search.service.test.ts,admin-provider-search.parsers.ts,admin-provider-search.parsers.test.ts,admin-provider-search-ranking.ts,admin-providers.types.ts,admin-providers.service.ts,admin.schemas.ts,admin.service.ts}`
  - `next-stack/apps/web/src/features/{admin/api.ts,providers/{AdminProvidersPage.tsx,admin-providers.helpers.ts,admin-providers.helpers.test.ts,admin-providers-panels.tsx},repairs/{use-repair-provider-part-search.ts,use-repair-provider-part-pricing.ts,repair-provider-part-pricing-section.helpers.ts,repair-provider-part-pricing-section.helpers.test.ts,repair-provider-part-search-results.tsx},warranties/admin-warranty-create.helpers.test.ts}`
  - `project-docs/{DECISIONS_LOG.md,backend/BACKEND_MAP.md,frontend/FRONTEND_MAP.md}`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. La busqueda agregada del flujo de reparaciones ahora consulta solo proveedores marcados con `searchInRepairs`, filtra resultados por matching exacto antes de rankear y deja de mostrar el desglose visible por proveedor en la UI. En admin/proveedores aparece el toggle `Incluir en busqueda de reparaciones`.
- Validaciones ejecutadas:
  - `cmd /c npm run db:generate --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run db:migrate --workspace @nico/api`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - el agregado ya no va a traer proveedores dummy/historicos salvo que el operador los marque explicitamente con `searchInRepairs`
  - `Celuphone`, `Evophone`, `Okey Rosario`, `Electrostore`, `El Reparador de PC`, `Novocell` y `Tienda Movil Rosario` quedaron alineados a perfiles/endpoints mas estables, pero siguen dependiendo de HTML/APIs de terceros que pueden cambiar
  - para poder regenerar Prisma Client con engine hubo que reiniciar el proceso local del API del repo y volver a levantar una instancia limpia para el smoke

### 2026-04-16 - Codex
- Alcance: corregir el cache de imagenes publicas de branding/auth para que los reemplazos desde identidad visual se reflejen enseguida en login y previews.
- Tipo de intervencion: bugfix full-stack sobre branding publico + consistencia UX en admin.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/store/{store.service.ts,store.service.test.ts}`
  - `next-stack/apps/web/src/features/admin/{brandAssetsApi.ts,admin-visual-identity.helpers.ts,admin-visual-identity.helpers.test.ts,admin-visual-identity.sections.tsx,admin-store-hero-settings.assets.tsx}`
  - `project-docs/{DECISIONS_LOG.md,architecture/ASSET_STRATEGY.md}`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. Los assets publicos personalizados de branding ahora salen con `?v=<updatedAt>` para invalidar cache del navegador cuando se reemplaza el archivo manteniendo el mismo nombre. En admin, un setting cuyo valor coincide con el `defaultPath` vuelve a mostrarse como `Por defecto` en vez de `Personalizado`.
- Validaciones ejecutadas:
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - el problema real no era `auth-visual__overlay`; era la combinacion de filename estable + cache del navegador
  - el circuito sigue priorizando la imagen personalizada; el fallback `brand/logo-bg.png` solo cubre el estado sin configuracion real

- Alcance: agregar un fallback visual por defecto para el fondo de login cuando `auth` todavia no tiene una imagen personalizada cargada.
- Tipo de intervencion: ajuste full-stack puntual sobre branding/auth.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/admin/{app-settings.registry.ts,app-settings.registry.test.ts}`
  - `next-stack/apps/api/src/modules/store/{store.service.ts,store.service.test.ts}`
  - `next-stack/apps/web/src/features/admin/{admin-visual-identity.helpers.ts,admin-visual-identity.helpers.test.ts}`
  - `project-docs/{DECISIONS_LOG.md,architecture/ASSET_STRATEGY.md}`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. Cuando no existe un asset personalizado para `auth_login_background` o `auth_login_background_mobile`, `/api/store/branding` ahora devuelve `brand/logo-bg.png` como fallback, y la vista de identidad visual lo refleja como `Por defecto` en vez de dejar el login sin imagen.
- Validaciones ejecutadas:
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - el fallback sirve solo para comprobar que el circuito funciona; sigue siendo recomendable cargar una imagen propia desde identidad visual para desktop y mobile
  - el overlay de `auth` sigue siendo solo una capa de contraste; el fondo editable real sale de `authPanelImages`

- Alcance: corregir la resolucion del fondo de login/branding publico y mejorar la UX de carga en identidad visual.
- Tipo de intervencion: bugfix full-stack + ajuste UX puntual en admin.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/store/{store.service.ts,store.service.test.ts}`
  - `next-stack/apps/web/src/features/admin/{brandAssetsApi.ts,admin-visual-identity.helpers.ts,admin-visual-identity.helpers.test.ts,admin-visual-identity.sections.tsx}`
  - `project-docs/{DECISIONS_LOG.md,architecture/ASSET_STRATEGY.md}`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. Los assets de branding expuestos por `/api/store/branding` dejan de resolverse contra `STORE_IMAGE_BASE_URL` y pasan a salir como rutas publicas de la web; por eso el fondo de login, hero e identidad visual quedan alineados con `apps/web/public`. En admin, los slots opcionales sin archivo ya no simulan una imagen configurada y muestran medidas recomendadas en px.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - los fondos de auth solo se veran en login cuando realmente exista un archivo configurado en identidad visual; si no, el backend seguira devolviendo `null`
  - `STORE_IMAGE_BASE_URL` sigue siendo valida para `storage/` legacy, pero ya no debe usarse para branding ni auth

---

### 2026-04-01 - Codex
- Alcance: cerrar el seccionado pendiente del frontend en admin general, catalogo tecnico y flujos publicos/detalle.
- Tipo de intervencion: refactor interno seguro multi-feature para consolidar el patron `Page.tsx` orquestadora + `helpers.ts` + `sections.tsx`.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/{AdminUsersPage.tsx,admin-users.helpers.ts,admin-users.helpers.test.ts,admin-users.sections.tsx,AdminSettingsHubPage.tsx,admin-settings-hub.helpers.ts,admin-settings-hub.helpers.test.ts,admin-settings-hub.sections.tsx,AdminAlertsPage.tsx,admin-alerts.helpers.ts,admin-alerts.helpers.test.ts,admin-alerts.sections.tsx,AdminHelpFaqPage.tsx,admin-help-faq.helpers.ts,admin-help-faq.helpers.test.ts,admin-help-faq.sections.tsx,AdminRepairTypesPage.tsx,admin-repair-types.helpers.ts,admin-repair-types.helpers.test.ts,admin-repair-types.sections.tsx,AdminDeviceTypesPage.tsx,admin-device-types.helpers.ts,admin-device-types.helpers.test.ts,admin-device-types.sections.tsx,admin-taxonomy.helpers.ts}`
  - `next-stack/apps/web/src/features/orders/{OrderDetailPage.tsx,order-detail.helpers.ts,order-detail.helpers.test.ts,order-detail.sections.tsx}`
  - `next-stack/apps/web/src/features/repairs/{RepairDetailPage.tsx,repair-detail.helpers.ts,repair-detail.helpers.test.ts,repair-detail.sections.tsx,PublicRepairLookupPage.tsx,public-repair-lookup.helpers.ts,public-repair-lookup.helpers.test.ts,public-repair-lookup.sections.tsx,PublicRepairQuoteApprovalPage.tsx,public-repair-quote-approval.helpers.ts,public-repair-quote-approval.helpers.test.ts,public-repair-quote-approval.sections.tsx}`
  - `project-docs/architecture/ARCHITECTURE.md`
  - `project-docs/frontend/FRONTEND_MAP.md`
  - `project-docs/DECISIONS_LOG.md`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: No deliberado. Se mantienen rutas, payloads y APIs; cambia la separacion interna entre fetch/sync, logica pura y bloques visuales. Como mejora menor, lookup publico, aprobacion de presupuesto y catalogo tecnico ahora centralizan mejor normalizaciones y mensajes derivados.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `cmd /c npm run qa:route-parity`
  - `git diff --check`
- Riesgos / notas:
  - el seccionado pendiente del frontend queda cerrado en los `Page.tsx` que todavia concentraban demasiada responsabilidad local
  - lo que sigue grande en el arbol son mayormente pantallas ya seccionadas o archivos `sections.tsx` deliberadamente densos, no nuevos hotspots sin estructura

---
### 2026-04-20 - Codex
- Alcance: corregir la UX de carga de assets en identidad visual para evitar que la previsualizacion simule persistencia antes de guardar.
- Tipo de intervencion: ajuste funcional de frontend en admin.
- Archivos tocados:
  - `next-stack/apps/web/src/features/admin/AdminVisualIdentityPage.tsx`
  - `next-stack/apps/web/src/features/admin/admin-visual-identity.sections.tsx`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. Elegir un archivo en identidad visual ahora dispara la subida real de inmediato; la previsualizacion muestra solo la imagen persistida y no un blob temporal local. Si la subida falla, queda un estado explicito para reintento.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - el boton `Reintentar subida` solo queda visible si hubo seleccion de archivo y la subida automatica no termino bien
  - la imagen de auth sigue dependiendo del slot correcto (`desktop` o `mobile`) segun el viewport real del login

---
### 2026-04-20 - Codex
- Alcance: hacer configurable el bloque visual izquierdo de auth desde identidad visual y sacar la superposicion oscura fija sobre la imagen.
- Tipo de intervencion: ajuste funcional full-stack liviano sobre branding/auth.
- Archivos tocados:
  - `next-stack/apps/api/src/modules/admin/app-settings.registry.ts`
  - `next-stack/apps/api/src/modules/store/{store.service.ts,store.service.test.ts}`
  - `next-stack/apps/web/src/features/auth/AuthLayout.tsx`
  - `next-stack/apps/web/src/features/admin/{AdminVisualIdentityPage.tsx,admin-visual-identity.helpers.ts,admin-visual-identity.helpers.test.ts,admin-visual-identity.sections.tsx}`
  - `next-stack/apps/web/src/features/store/types.ts`
  - `next-stack/apps/web/src/styles/auth.css`
  - `project-docs/{DECISIONS_LOG.md,architecture/ARCHITECTURE.md,frontend/FRONTEND_MAP.md}`
  - `CHANGELOG_AI.md`
- ¿Cambio comportamiento funcional?: Si. El panel izquierdo de auth ya no renderiza overlay oscuro fijo, consume `eyebrow`, `titulo`, `descripcion` y `color` desde `/api/store/branding`, y esos valores ahora se editan desde `AdminVisualIdentityPage`.
- Validaciones ejecutadas:
  - `cmd /c npm run typecheck --workspace @nico/api`
  - `cmd /c npm run test --workspace @nico/api`
  - `cmd /c npm run build --workspace @nico/api`
  - `cmd /c npm run typecheck --workspace @nico/web`
  - `cmd /c npm run test --workspace @nico/web`
  - `cmd /c npm run build --workspace @nico/web`
  - `cmd /c npm run smoke:backend`
  - `cmd /c npm run smoke:web`
  - `git diff --check`
- Riesgos / notas:
  - el color del texto de auth se normaliza a HEX de 6 digitos; si se guarda un valor invalido, el frontend cae a `#FFFFFF`
  - el panel visual sigue usando sombra suave de texto para legibilidad, pero sin tapar la imagen con una capa oscura fija

---
