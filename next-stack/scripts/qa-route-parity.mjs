import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const WEB_SRC = path.join(ROOT, 'apps', 'web', 'src');
const APP_TSX = path.join(WEB_SRC, 'App.tsx');
const WEB_FEATURES = path.join(WEB_SRC, 'features');
const API_MODULES = path.join(ROOT, 'apps', 'api', 'src', 'modules');

const EXPECTED_LEGACY_ALIASES = [
  '/tienda',
  '/tienda/categoria/:slug',
  '/producto/:slug',
  '/ayuda',
  '/login',
  '/registro',
  '/olvide-contrasena',
  '/resetear-contrasena/:token',
  '/carrito',
  '/mis-pedidos',
  '/mis-pedidos/:id',
  '/pedido/:id',
  '/mis-reparaciones',
  '/mis-reparaciones/:id',
  '/mi-cuenta',
  '/email/verificar',
  '/email/verificar/:id/:hash',
  '/reparacion/:id/presupuesto',
  '/admin/dashboard',
  '/admin/pedidos',
  '/admin/pedidos/:id',
  '/admin/pedidos/:id/imprimir',
  '/admin/pedidos/:id/ticket',
  '/admin/reparaciones',
  '/admin/reparaciones/crear',
  '/admin/reparaciones/:id',
  '/admin/reparaciones/:id/imprimir',
  '/admin/reparaciones/:id/ticket',
  '/admin/usuarios',
  '/admin/configuracion',
  '/admin/configuracion/identidad-visual',
  '/admin/configuracion/portada-tienda',
  '/admin/configuracion/correos',
  '/admin/configuracion/ayuda',
  '/admin/whatsapp-pedidos',
  '/admin/tipos-reparacion',
  '/admin/grupos-modelos',
  '/admin/tipos-dispositivo',
  '/admin/catalogo-dispositivos',
  '/admin/categorias',
  '/admin/categorias/crear',
  '/admin/categorias/:id/editar',
  '/admin/productos/:id/etiqueta',
  '/admin/precios/:id/editar',
  '/admin/ventas-rapidas',
  '/admin/ventas-rapidas/ticket',
  '/admin/ventas-rapidas/historial',
];

function walk(dir, predicate, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs, predicate, out);
      continue;
    }
    if (predicate(abs)) out.push(abs);
  }
  return out;
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function normalizeRouteLikePath(inputPath) {
  let value = inputPath.trim();
  value = value.replace(/\/\$\{[^}]+\}/g, '/:param');
  value = value.replace(/\$\{[^}]+\}/g, '');
  value = value.split('?')[0];
  value = value.replace(/\{[^}:]+(?::[^}]+)?\}/g, ':param');
  value = value.replace(/:[A-Za-z0-9_]+/g, ':param');
  value = value.replace(/\/+/g, '/');
  if (value.length > 1 && value.endsWith('/')) value = value.slice(0, -1);
  return value || '/';
}

function toMatcher(routePath) {
  let pattern = routePath.replace(/:[A-Za-z0-9_]+/g, '[^/]+');
  pattern = pattern.replace(/\*/g, '.*');
  return new RegExp(`^${pattern}$`);
}

function extractAppRoutes() {
  const appText = read(APP_TSX);
  const routeRx = /<Route\s+path="([^"]+)"/g;
  const routes = [];
  let match = routeRx.exec(appText);
  while (match) {
    routes.push(match[1].trim());
    match = routeRx.exec(appText);
  }
  return routes;
}

function extractNavPaths() {
  const files = walk(WEB_SRC, (p) => /\.(tsx|ts|jsx|js)$/i.test(p));
  const patterns = [
    /\bto\s*=\s*"([^"\n\r]+)"/g,
    /\bto\s*=\s*'([^'\n\r]+)'/g,
    /\bto\s*=\s*{\s*`([^`\n\r]+)`\s*}/g,
    /\bnavigate\(\s*"([^"\n\r]+)"/g,
    /\bnavigate\(\s*'([^'\n\r]+)'/g,
    /\bnavigate\(\s*`([^`\n\r]+)`/g,
    /\bhref\s*=\s*"([^"\n\r]+)"/g,
    /\bhref\s*=\s*'([^'\n\r]+)'/g,
    /\bhref\s*=\s*{\s*`([^`\n\r]+)`\s*}/g,
  ];

  const map = new Map();
  for (const file of files) {
    const rel = path.relative(WEB_SRC, file);
    const text = read(file);
    for (const pattern of patterns) {
      let match = pattern.exec(text);
      while (match) {
        const raw = match[1].trim();
        if (raw.startsWith('/')) {
          const normalized = normalizeRouteLikePath(raw);
          const withoutQuery = normalized.split('?')[0];
          if (!withoutQuery.startsWith('/api/')) {
            if (!map.has(withoutQuery)) map.set(withoutQuery, new Set());
            map.get(withoutQuery).add(rel);
          }
        }
        match = pattern.exec(text);
      }
    }
  }
  return map;
}

function extractBackendEndpoints() {
  const controllerFiles = walk(API_MODULES, (p) => /controller\.ts$/i.test(p));
  const endpoints = new Set();

  for (const file of controllerFiles) {
    const text = read(file);
    const controllerMatches = [...text.matchAll(/@Controller\(([^)]*)\)/g)];
    let controllerPath = '';
    if (controllerMatches.length > 0) {
      const raw = controllerMatches.at(-1)?.[1] ?? '';
      const m = raw.match(/['"`]([^'"`]+)['"`]/);
      controllerPath = m ? m[1] : '';
    }

    const methodRx = /@(Get|Post|Patch|Put|Delete)\(([^)]*)\)/g;
    let methodMatch = methodRx.exec(text);
    while (methodMatch) {
      const method = methodMatch[1].toUpperCase();
      const arg = methodMatch[2];
      const m = arg.match(/['"`]([^'"`]*)['"`]/);
      const methodPath = m ? m[1] : '';
      const full = `/${[controllerPath, methodPath].filter(Boolean).join('/')}`;
      endpoints.add(`${method} ${normalizeRouteLikePath(full)}`);
      methodMatch = methodRx.exec(text);
    }
  }

  return endpoints;
}

function extractFrontendApiCalls() {
  const apiFiles = walk(WEB_FEATURES, (p) => /(api|http)\.ts$/i.test(p));
  const calls = [];

  const rx =
    /(authJsonRequest|publicJsonRequest|adminAuthRequest|adminAuthFetch|authFetch)\s*(?:<[^>]*>)?\s*\(\s*([`'"])(\/[^`'"]*)\2\s*(?:,\s*\{([\s\S]*?)\})?/g;

  for (const file of apiFiles) {
    const rel = path.relative(WEB_SRC, file);
    const text = read(file);
    let match = rx.exec(text);
    while (match) {
      const rawPath = match[3];
      const optionsObject = match[4] ?? '';
      let method = 'GET';
      const methodMatch = optionsObject.match(/method\s*:\s*['"](GET|POST|PATCH|PUT|DELETE)['"]/i);
      if (methodMatch) method = methodMatch[1].toUpperCase();

      let pathValue = rawPath;
      // Handles nested template literals like `/path${cond ? `?x` : ''}` where regex cuts before closing brace.
      if (pathValue.includes('${') && !pathValue.includes('}')) {
        pathValue = pathValue.split('${')[0];
      }

      calls.push({
        method,
        path: normalizeRouteLikePath(pathValue),
        file: rel,
      });

      match = rx.exec(text);
    }
  }

  return calls;
}

function uniqueEntries(items) {
  const map = new Map();
  for (const item of items) {
    const key = `${item.method} ${item.path}`;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(item.file);
  }
  return map;
}

function main() {
  const appRoutes = extractAppRoutes();
  const appRouteSet = new Set(appRoutes);
  const appMatchers = appRoutes.map((r) => ({
    route: r,
    matcher: toMatcher(r),
  }));

  const missingLegacyAliases = EXPECTED_LEGACY_ALIASES.filter((route) => !appRouteSet.has(route));

  const navPaths = extractNavPaths();
  const unmatchedNav = [];
  for (const [navPath, files] of navPaths.entries()) {
    const covered = appMatchers.some(({ matcher }) => matcher.test(navPath));
    if (!covered) {
      unmatchedNav.push({ path: navPath, files: [...files].sort() });
    }
  }
  unmatchedNav.sort((a, b) => a.path.localeCompare(b.path));

  const backendEndpoints = extractBackendEndpoints();
  const frontendApiCalls = extractFrontendApiCalls();
  const uniqueFrontendCalls = uniqueEntries(frontendApiCalls);
  const missingApiCalls = [];
  for (const [key, files] of uniqueFrontendCalls.entries()) {
    if (!backendEndpoints.has(key)) {
      missingApiCalls.push({ key, files: [...files].sort() });
    }
  }
  missingApiCalls.sort((a, b) => a.key.localeCompare(b.key));

  console.log('[qa:route-parity] Resumen');
  console.log(`- Rutas en App.tsx: ${appRoutes.length}`);
  console.log(`- Alias legacy requeridos: ${EXPECTED_LEGACY_ALIASES.length}`);
  console.log(`- Alias legacy faltantes: ${missingLegacyAliases.length}`);
  console.log(`- Paths de navegacion detectados: ${navPaths.size}`);
  console.log(`- Paths de navegacion sin route: ${unmatchedNav.length}`);
  console.log(`- Endpoints backend detectados: ${backendEndpoints.size}`);
  console.log(`- Llamadas API frontend detectadas: ${uniqueFrontendCalls.size}`);
  console.log(`- Llamadas API sin endpoint backend: ${missingApiCalls.length}`);

  if (missingLegacyAliases.length > 0) {
    console.log('\n[qa:route-parity] Alias legacy faltantes');
    for (const route of missingLegacyAliases) {
      console.log(`- ${route}`);
    }
  }

  if (unmatchedNav.length > 0) {
    console.log('\n[qa:route-parity] Navegacion sin route');
    for (const item of unmatchedNav) {
      console.log(`- ${item.path} (${item.files.join(', ')})`);
    }
  }

  if (missingApiCalls.length > 0) {
    console.log('\n[qa:route-parity] API frontend sin endpoint backend');
    for (const item of missingApiCalls) {
      console.log(`- ${item.key} (${item.files.join(', ')})`);
    }
  }

  if (missingLegacyAliases.length > 0 || unmatchedNav.length > 0 || missingApiCalls.length > 0) {
    process.exit(1);
  }

  console.log('\n[qa:route-parity] OK');
}

main();
