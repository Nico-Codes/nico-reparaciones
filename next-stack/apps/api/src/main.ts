import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './modules/app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const expressApp = app.getHttpAdapter().getInstance?.();
  if (expressApp?.disable) {
    expressApp.disable('x-powered-by');
  }

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`[nico/api] listening on http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  console.error('[nico/api] bootstrap error', err);
  process.exit(1);
});
