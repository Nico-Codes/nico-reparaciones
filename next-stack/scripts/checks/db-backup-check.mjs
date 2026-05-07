import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { config as loadEnv } from 'dotenv';

const root = process.cwd();
const envProd = path.join(root, '.env.production');
const envRoot = path.join(root, '.env');
const source = fs.existsSync(envProd) ? envProd : envRoot;

if (fs.existsSync(source)) loadEnv({ path: source, override: true });

const errors = [];
const warnings = [];
const info = [];

function get(name) {
  return (process.env[name] ?? '').trim();
}

function isPgUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'postgresql:' || url.protocol === 'postgres:';
  } catch {
    return false;
  }
}

function commandVersion(command) {
  try {
    return execFileSync(command, ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

const databaseUrl = get('DATABASE_URL');
if (!databaseUrl) errors.push('DATABASE_URL: faltante');
else if (!isPgUrl(databaseUrl)) errors.push('DATABASE_URL: debe ser una URL PostgreSQL');

const pgDumpVersion = commandVersion('pg_dump');
if (!pgDumpVersion) errors.push('pg_dump: no disponible en PATH; instalalo antes de publicar o definí el runtime de backup administrado');
else info.push(`pg_dump: ${pgDumpVersion}`);

const pgRestoreVersion = commandVersion('pg_restore');
if (!pgRestoreVersion) warnings.push('pg_restore: no disponible en PATH; los restores locales no quedan cubiertos');
else info.push(`pg_restore: ${pgRestoreVersion}`);

const backupDir = get('PG_BACKUP_DIR');
if (backupDir) {
  const resolved = path.resolve(backupDir);
  if (!fs.existsSync(resolved)) warnings.push(`PG_BACKUP_DIR: no existe (${resolved})`);
  else info.push(`PG_BACKUP_DIR: ${resolved}`);
} else {
  warnings.push('PG_BACKUP_DIR: no configurado; documentá dónde se guardarán backups y cómo se rotan');
}

const offsite = get('BACKUP_OFFSITE_TARGET');
if (!offsite) warnings.push('BACKUP_OFFSITE_TARGET: no configurado; recomendado para copia fuera del servidor');

console.log('[db:backup:check] Archivo leído:', fs.existsSync(source) ? source : '(ninguno)');
if (info.length) {
  console.log('[db:backup:check] INFO');
  for (const line of info) console.log(` - ${line}`);
}
if (warnings.length) {
  console.log('[db:backup:check] WARN');
  for (const line of warnings) console.log(` - ${line}`);
}
if (errors.length) {
  console.log('[db:backup:check] FAIL');
  for (const line of errors) console.log(` - ${line}`);
  process.exit(1);
}
console.log('[db:backup:check] OK');
