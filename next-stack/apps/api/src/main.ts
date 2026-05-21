import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { HttpExceptionFilter } from './common/http-exception.filter.js';
import { appLog, isTruthy } from './common/logging.js';
import { loadCanonicalEnv } from './load-canonical-env.js';
import { AppModule } from './modules/app.module.js';
import { PrismaService } from './modules/prisma/prisma.service.js';

loadCanonicalEnv();

type RequestWithId = {
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
  originalUrl?: string;
  url?: string;
  requestId?: string;
};

type ResponseWithStatus = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  on: (event: 'finish', listener: () => void) => void;
};

type ExpressLike = {
  disable?: (name: string) => void;
  get?: (path: string, handler: (req: unknown, res: { redirect: (status: number, url: string) => void; type: (value: string) => void; send: (body: string) => void }) => void) => void;
  set?: (name: string, value: unknown) => void;
};

function env(name: string) {
  return (process.env[name] ?? '').trim();
}

function isProductionLike() {
  return ['production', 'prod'].includes(env('NODE_ENV').toLowerCase());
}

function isLocalDevOrigin(value: string) {
  try {
    const url = new URL(value);
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
    const isLoopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    return isHttp && isLoopback;
  } catch {
    return false;
  }
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isPlaceholderSecret(value: string) {
  const lower = value.toLowerCase();
  return lower.includes('cambiar') || lower.includes('placeholder') || lower.includes('default');
}

function shouldLogHttpRequests() {
  const explicit = env('LOG_HTTP_REQUESTS');
  if (!explicit) return true;
  return isTruthy(explicit);
}

function resolveWebPublicDirs() {
  const cwd = process.cwd();
  const envCandidates = [process.env.WEB_PUBLIC_DIR, process.env.APP_WEB_PUBLIC_DIR]
    .map((value) => (value ?? '').trim())
    .filter((value): value is string => Boolean(value))
    .map((value) => path.resolve(value));

  const candidates = [
    ...envCandidates,
    path.resolve(cwd, 'apps/web/public'),
    path.resolve(cwd, '../web/public'),
    path.resolve(cwd, '../../apps/web/public'),
  ];
  return Array.from(new Set(candidates)).filter((p) => existsSync(p));
}

function setWebPublicAssetCacheHeaders(publicDir: string, res: { setHeader: (name: string, value: string) => void }, filePath: string) {
  const relativePath = path.relative(publicDir, filePath).replace(/\\/g, '/');
  if (!relativePath || relativePath.startsWith('..')) return;

  if (relativePath.startsWith('brand-assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    return;
  }

  if (
    relativePath.startsWith('brand/') ||
    relativePath.startsWith('icons/') ||
    /^favicon(?:-|\.|$)/i.test(relativePath) ||
    /^android-chrome-/i.test(relativePath) ||
    relativePath === 'apple-touch-icon.png' ||
    relativePath === 'site.webmanifest'
  ) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=3600');
}

function registerSeoRootRoutes(expressApp?: ExpressLike) {
  if (!expressApp?.get) return;
  expressApp.get('/sitemap.xml', (_req, res) => {
    res.redirect(302, '/api/seo/sitemap.xml');
  });
  expressApp.get('/robots.txt', (_req, res) => {
    const baseUrl = env('WEB_URL').replace(/\/+$/, '') || 'http://localhost:5174';
    res.type('text/plain; charset=utf-8');
    res.send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /auth',
        'Disallow: /checkout',
        'Disallow: /cart',
        'Disallow: /orders',
        `Sitemap: ${baseUrl}/sitemap.xml`,
        '',
      ].join('\n'),
    );
  });
}

function assertProductionSafeEnv() {
  if (!isProductionLike()) return;

  const errors: string[] = [];
  const jwtAccess = env('JWT_ACCESS_SECRET');
  const jwtRefresh = env('JWT_REFRESH_SECRET');
  const webUrl = env('WEB_URL');
  const apiUrl = env('API_URL');
  const corsOrigins = env('CORS_ORIGINS');
  const allowBootstrap = env('ALLOW_ADMIN_BOOTSTRAP');
  const previewTokens = env('MAIL_PREVIEW_TOKENS');
  const googleEnabled = isTruthy(env('GOOGLE_OAUTH_ENABLED'));
  const googleClientId = env('GOOGLE_CLIENT_ID');
  const googleClientSecret = env('GOOGLE_CLIENT_SECRET');
  const googleRedirectUri = env('GOOGLE_OAUTH_REDIRECT_URI');
  const appleEnabled = isTruthy(env('APPLE_SIGNIN_ENABLED'));
  const appleClientId = env('APPLE_CLIENT_ID');
  const appleTeamId = env('APPLE_TEAM_ID');
  const appleKeyId = env('APPLE_KEY_ID');
  const applePrivateKey = env('APPLE_PRIVATE_KEY');
  const appleRedirectUri = env('APPLE_SIGNIN_REDIRECT_URI');

  if (jwtAccess.length < 32) errors.push('JWT_ACCESS_SECRET demasiado corto (mínimo recomendado: 32)');
  if (jwtRefresh.length < 32) errors.push('JWT_REFRESH_SECRET demasiado corto (mínimo recomendado: 32)');
  if (jwtAccess && isPlaceholderSecret(jwtAccess)) errors.push('JWT_ACCESS_SECRET parece placeholder');
  if (jwtRefresh && isPlaceholderSecret(jwtRefresh)) errors.push('JWT_REFRESH_SECRET parece placeholder');
  if (!webUrl || !isHttpsUrl(webUrl)) errors.push('WEB_URL debe ser HTTPS en producción');
  if (!apiUrl || !isHttpsUrl(apiUrl)) errors.push('API_URL debe ser HTTPS en producción');
  if (!corsOrigins) errors.push('CORS_ORIGINS debe estar configurado en producción');
  if (isTruthy(allowBootstrap)) errors.push('ALLOW_ADMIN_BOOTSTRAP no puede estar habilitado en producción');
  if (isTruthy(previewTokens)) errors.push('MAIL_PREVIEW_TOKENS no puede estar habilitado en producción');
  if (googleEnabled && !googleClientId) errors.push('GOOGLE_CLIENT_ID es obligatorio cuando GOOGLE_OAUTH_ENABLED=1');
  if (googleEnabled && !googleClientSecret) errors.push('GOOGLE_CLIENT_SECRET es obligatorio cuando GOOGLE_OAUTH_ENABLED=1');
  if (googleEnabled && googleRedirectUri && !isHttpsUrl(googleRedirectUri)) {
    errors.push('GOOGLE_OAUTH_REDIRECT_URI debe ser HTTPS en producción');
  }
  if (appleEnabled && !appleClientId) errors.push('APPLE_CLIENT_ID es obligatorio cuando APPLE_SIGNIN_ENABLED=1');
  if (appleEnabled && !appleTeamId) errors.push('APPLE_TEAM_ID es obligatorio cuando APPLE_SIGNIN_ENABLED=1');
  if (appleEnabled && !appleKeyId) errors.push('APPLE_KEY_ID es obligatorio cuando APPLE_SIGNIN_ENABLED=1');
  if (appleEnabled && !applePrivateKey) errors.push('APPLE_PRIVATE_KEY es obligatorio cuando APPLE_SIGNIN_ENABLED=1');
  if (appleEnabled && appleRedirectUri && !isHttpsUrl(appleRedirectUri)) {
    errors.push('APPLE_SIGNIN_REDIRECT_URI debe ser HTTPS en producción');
  }

  if (errors.length) {
    throw new Error(`[env] Configuración insegura para producción:\n- ${errors.join('\n- ')}`);
  }
}

async function bootstrap() {
  assertProductionSafeEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const httpLoggingEnabled = shouldLogHttpRequests();
  const appVersion = env('APP_VERSION') || process.env.npm_package_version || '0.0.0';
  const gitSha = env('GIT_SHA');
  app.use((req: RequestWithId, res: ResponseWithStatus, next: () => void) => {
    const incoming = typeof req.headers?.['x-request-id'] === 'string' ? req.headers['x-request-id'] : '';
    const requestId = incoming.trim() || randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    const startedAt = Date.now();
    res.on('finish', () => {
      if ((process.env.NODE_ENV ?? '').toLowerCase() === 'test') return;
      if (!httpLoggingEnabled) return;
      const elapsedMs = Date.now() - startedAt;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'log';
      appLog(level as 'log' | 'warn' | 'error', '[http] request', {
        method: req.method,
        path: req.originalUrl ?? req.url,
        statusCode: res.statusCode,
        elapsedMs,
        requestId,
      });
    });

    next();
  });
  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length
      ? (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
          if (!isProductionLike() && isLocalDevOrigin(origin)) return callback(null, true);
          return callback(new Error('Origen no permitido por CORS'), false);
        }
      : true,
    credentials: true,
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.use((_req: RequestWithId, res: ResponseWithStatus, next: () => void) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    next();
  });

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  await app.get(PrismaService).enableShutdownHooks(app);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  const expressApp = app.getHttpAdapter().getInstance?.() as ExpressLike | undefined;
  if (expressApp?.disable) {
    expressApp.disable('x-powered-by');
  }
  registerSeoRootRoutes(expressApp);
  for (const webPublicDir of resolveWebPublicDirs()) {
    app.useStaticAssets(webPublicDir, {
      index: false,
      setHeaders: (res, filePath) => setWebPublicAssetCacheHeaders(webPublicDir, res, filePath),
    });
  }
  if (expressApp?.set && isTruthy(env('TRUST_PROXY'))) {
    expressApp.set('trust proxy', 1);
  }

  const host = env('HOST') || '0.0.0.0';
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, host);
  const logHost = host === '0.0.0.0' ? 'localhost' : host;
  appLog('log', '[nico/api] listening', { url: `http://${logHost}:${port}/api` });
  appLog('log', '[nico/api] build', {
    version: appVersion,
    gitSha: gitSha || null,
    env: (process.env.NODE_ENV ?? 'development').toLowerCase(),
    httpLogs: httpLoggingEnabled,
  });
}

bootstrap().catch((err) => {
  appLog('error', '[nico/api] bootstrap error', {
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  process.exit(1);
});
