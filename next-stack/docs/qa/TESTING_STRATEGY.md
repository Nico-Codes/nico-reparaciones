# Testing Strategy

## Objetivo

Evitar regresiones antes de publicar con una cobertura por capas. No existe un test "total" que garantice cero errores, pero el stack debe cubrir:

- reglas puras y helpers con Vitest;
- contratos y servicios criticos de API;
- flujos reales con smoke backend;
- rutas, guards y sesiones con E2E frontend;
- checks de deploy, entorno, performance, responsive y visual admin;
- inventario ejecutable para detectar perdida de cobertura.

## Repertorio actual

### Unitarios e integracion liviana

- `npm run test --workspace @nico/api`
  - Auth, carrito, tienda, pedidos, reparaciones, proveedores, encargues, SEO, settings y reglas de negocio.
- `npm run test --workspace @nico/web`
  - Store, producto, carrito, checkout, pedidos, reserva WhatsApp, admin, reparaciones, providers, auth, identidad visual y shell.

### Smoke / E2E

- `npm run smoke:backend`
  - API real con bootstrap/login, store, carrito, checkout, pedidos, reparaciones, admin, proveedores, garantias, WhatsApp, SEO y telemetria cliente.
- `npm run smoke:web`
  - Build web + preview + rutas publicas base.
- `npm run qa:frontend:e2e`
  - Frontend contra API real, sesiones admin/user, aliases, rutas protegidas y rutas admin principales.
- `npm run qa:admin:visual`
  - Captura visual de pantallas admin clave.

### Publicacion y regresion transversal

- `npm run qa:test-inventory`
  - Lista cantidad de tests, scripts QA y cobertura directa por modulo/feature.
  - Falla si desaparecen scripts o tests criticos.
  - Advierte modulos sin test directo para priorizar mejoras.
- `npm run qa:route-parity`
  - Valida aliases y rutas canonicas.
- `npm run qa:performance`
  - Mide requests, transferencia aproximada y tiempos base.
- `npm run qa:responsive:visual`
  - Capturas responsive para detectar regresiones visuales.
- `npm run env:check` y `npm run deploy:check`
  - Endurecen configuracion antes de publicar.
- `npm run db:backup:check`
  - Valida herramientas y variables necesarias para backup/restore.

## Gates recomendados

### Desarrollo diario

```bash
npm run typecheck --workspace @nico/api
npm run test --workspace @nico/api
npm run typecheck --workspace @nico/web
npm run test --workspace @nico/web
```

### Antes de mergear/publicar cambios normales

```bash
npm run qa:test-inventory
npm run typecheck
npm run test
npm run build
npm run smoke:web
```

### Antes de deploy real

```bash
npm run env:check
npm run deploy:check
npm run db:backup:check
npm run qa:backend:full
npm run qa:frontend:e2e
npm run qa:admin:visual
npm run qa:route-parity
npm run qa:performance
npm run qa:responsive:visual
```

## Politica de nuevos tests

- Todo bug corregido debe tener test si la logica puede aislarse en helper, servicio o parser.
- Todo flujo critico nuevo debe entrar como minimo en smoke backend o E2E frontend.
- Toda regla de negocio de dinero, stock, encargues, colores, roles o estados debe tener test unitario.
- Todo parser externo de proveedor debe tener fixture.
- No agregar tests fragiles basados solo en texto visible si existe selector estable.
- No crear mocks enormes para repetir implementacion; extraer helpers testeables cuando una view crece demasiado.

## Limites conocidos

- Los tests no reemplazan una prueba manual final con datos reales, especialmente pagos, SMTP, Google OAuth, WhatsApp y proveedores externos.
- `qa:performance` es una medicion operativa inicial, no Lighthouse completo.
- `db:backup:check` puede fallar localmente si `pg_dump`/`pg_restore` no estan en PATH; debe pasar en el entorno que ejecutara backups.
