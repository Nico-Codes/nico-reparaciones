import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { loadCanonicalEnv, resolveCanonicalEnvPaths } from '../src/load-canonical-env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envCandidates = resolveCanonicalEnvPaths();
loadCanonicalEnv();

function maskDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = '***';
    if (parsed.username) parsed.username = parsed.username;
    return parsed.toString();
  } catch {
    return '<invalid DATABASE_URL>';
  }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    console.error('[db:check] FAIL: DATABASE_URL no está definido');
    console.error('[db:check] Busqué .env en:');
    for (const candidate of envCandidates) console.error(` - ${candidate}`);
    process.exit(1);
  }

  console.log('[db:check] DATABASE_URL:', maskDatabaseUrl(dbUrl));

  try {
    const parsed = new URL(dbUrl);
    console.log('[db:check] target:', {
      host: parsed.hostname,
      port: parsed.port || '(default)',
      database: parsed.pathname.replace(/^\//, ''),
      user: parsed.username || '(none)',
      schema: parsed.searchParams.get('schema') || '(default)',
    });
  } catch {
    console.warn('[db:check] warning: DATABASE_URL no se pudo parsear con URL()');
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('[db:check] OK: conexión a PostgreSQL y query de prueba exitosas');
  } catch (error) {
    console.error('[db:check] FAIL: no se pudo conectar o ejecutar query');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

main().catch((error) => {
  console.error('[db:check] ERROR', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
