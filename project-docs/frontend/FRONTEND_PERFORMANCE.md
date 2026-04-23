# Frontend Performance

## Estado
- Fecha de cierre: 2026-03-10
- Alcance: `next-stack/apps/web`
- Estado actual: optimización aplicada y validada

## Problema detectado
El build de `@nico/web` venía mostrando el warning de chunk grande de Vite. La causa principal no era un asset puntual sino la estrategia de carga del router:

- `next-stack/apps/web/src/App.tsx` importaba de forma eager casi todas las páginas
- eso hacía que gran parte del producto entrara al chunk inicial
- admin, store, cuenta usuario y vistas secundarias se cargaban demasiado pronto

## Hallazgos de auditoría

### Causa principal
- Router con imports eager de páginas de:
  - admin
  - store
  - orders
  - repairs
  - auth
  - providers / warranties / catalog admin

### Causa secundaria
- Falta de división por ruta, pese a que el producto ya tiene una estructura modular clara.

### Assets
- Se revisaron los assets públicos de `next-stack/apps/web/public`.
- Hay imágenes relativamente grandes en branding y hero, pero no eran la causa principal del warning de chunk grande del build JavaScript.
- Quedan como backlog opcional de optimización posterior si se quiere mejorar aún más LCP o peso visual, pero no bloqueaban esta fase.

## Optimización aplicada

### Estrategia
Se aplicó code splitting por ruta en `next-stack/apps/web/src/App.tsx` usando:

- `React.lazy`
- `Suspense`
- fallbacks limpios y coherentes con el sistema visual actual

### Decisión
Se mantuvieron eager solo las piezas que deben estar disponibles siempre:

- `AppShell`
- `RequireAuth`
- `RequireAdmin`
- `BrandingHeadSync`
- `GlobalVisualEnhancements`
- utilidades pequeñas de routing / auth local

Todas las páginas de ruta pasaron a carga diferida.

## Impacto medido

### Antes
- chunk principal JS aproximado: `769.29 kB`
- warning de chunk grande de Vite: presente

### Después
- chunk principal JS: `317.30 kB`
- warning de chunk grande de Vite: desaparecido en el build actual

### Observación
El código de cada área quedó separado en chunks por ruta o submódulo. Algunos ejemplos del build optimizado:

- `StorePage-*.js`: ~`10.73 kB`
- `AdminOrdersPage-*.js`: ~`12.87 kB`
- `AdminProductEditPage-*.js`: ~`14.75 kB`

Esto reduce el costo de carga inicial y hace que el navegador pida código pesado solo cuando la ruta realmente lo necesita.

## Impacto esperado en UX
- menor peso inicial del frontend
- menor costo para entrar a la app o recargarla
- mejor aislamiento entre store, admin y cuenta
- menor penalización para usuarios que nunca visitan módulos secundarios
- base más sana para seguir escalando vistas admin sin inflar el bundle principal

## Archivos clave
- `next-stack/apps/web/src/App.tsx`
- `project-docs/FRONTEND_PERFORMANCE.md`

## Validación usada
- `npm run typecheck --workspace @nico/api`
- `npm run typecheck --workspace @nico/web`
- `npm run build --workspace @nico/api`
- `npm run build --workspace @nico/web`
- `npm run smoke:web`
- `npm run qa:route-parity`

## Pendiente opcional
No es bloqueante para esta fase, pero puede evaluarse más adelante:

- optimización de imágenes de hero / branding
- revisar si algún módulo admin muy pesado merece sub-splitting adicional
- solo introducir `manualChunks` si reaparece un hotspot real que no se resuelva bien con lazy loading por ruta

## Hardening 2026-04-23

Se agrego una segunda etapa de optimizacion sin modificar imagenes:

- `BrandingHeadSync`, `AppShell` y `AuthLayout` consumen branding desde un cache/provider compartido para evitar requests duplicados a `/store/branding`.
- `/store` usa `GET /api/store/home` en la carga inicial sin filtros; el endpoint agrega hero, branding, categorias y primera pagina de productos.
- `styles.css` queda con base/layout/componentes globales; los estilos de `store`, `auth`, `admin`, `commerce` y `repairs` se cargan junto al chunk lazy de cada ruta.
- la API agrega `Cache-Control` explicito para assets publicos de `apps/web/public`.
- `npm run qa:performance` mide requests, transferencia JS/CSS/img y `domcontentloaded` de rutas clave usando Playwright.

Pendiente intencional:

- no se comprimieron ni reemplazaron imagenes grandes; el operador las cambiara luego desde Identidad visual.
