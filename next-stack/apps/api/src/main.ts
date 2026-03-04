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
import { AppModule } from './modules/app.module.js';
import { PrismaService } from './modules/prisma/prisma.service.js';

function env(name: string) {
  return (process.env[name] ?? '').trim();
}

function isProductionLike() {
  return ['production', 'prod'].includes(env('NODE_ENV').toLowerCase());
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

function resolveWebPublicDir() {
  const cwd = process.cwd();
  const candidates = [
    path.resolve(cwd, 'apps/web/public'),
    path.resolve(cwd, '../web/public'),
    path.resolve(cwd, '../../apps/web/public'),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

function assertProductionSafeEnv() {
  if (!isProductionLike()) return;

  const errors: string[] = [];
  const jwtAccess = env('JWT_ACCESS_SECRET');
  const jwtRefresh = env('JWT_REFRESH_SECRET');
  const webUrl = env('WEB_URL');
  const apiUrl = env('API_URL');
  const allowBootstrap = env('ALLOW_ADMIN_BOOTSTRAP');
  const previewTokens = env('MAIL_PREVIEW_TOKENS');

  if (jwtAccess.length < 32) errors.push('JWT_ACCESS_SECRET demasiado corto (mínimo recomendado: 32)');
  if (jwtRefresh.length < 32) errors.push('JWT_REFRESH_SECRET demasiado corto (mínimo recomendado: 32)');
  if (jwtAccess && isPlaceholderSecret(jwtAccess)) errors.push('JWT_ACCESS_SECRET parece placeholder');
  if (jwtRefresh && isPlaceholderSecret(jwtRefresh)) errors.push('JWT_REFRESH_SECRET parece placeholder');
  if (!webUrl || !isHttpsUrl(webUrl)) errors.push('WEB_URL debe ser HTTPS en producción');
  if (!apiUrl || !isHttpsUrl(apiUrl)) errors.push('API_URL debe ser HTTPS en producción');
  if (isTruthy(allowBootstrap)) errors.push('ALLOW_ADMIN_BOOTSTRAP no puede estar habilitado en producción');
  if (isTruthy(previewTokens)) errors.push('MAIL_PREVIEW_TOKENS no puede estar habilitado en producción');

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
  app.use((req: any, res: any, next: () => void) => {
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
  const expressApp = app.getHttpAdapter().getInstance?.();
  if (expressApp?.disable) {
    expressApp.disable('x-powered-by');
  }
  const webPublicDir = resolveWebPublicDir();
  if (webPublicDir) {
    app.useStaticAssets(webPublicDir, { index: false });
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
