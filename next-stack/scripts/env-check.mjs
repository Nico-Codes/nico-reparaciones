import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { config as loadEnv } from 'dotenv';

const root = process.cwd();
const rootEnv = path.join(root, '.env');
const apiEnv = path.join(root, 'apps', 'api', '.env');

if (fs.existsSync(rootEnv)) loadEnv({ path: rootEnv, override: true });

const errors = [];
const warnings = [];
const info = [];

function get(name) {
  return (process.env[name] ?? '').trim();
}

function requireVar(name, validator, message) {
  const value = get(name);
  if (!value) {
    errors.push(`${name}: faltante`);
    return;
  }
  if (validator && !validator(value)) {
    errors.push(`${name}: ${message ?? 'inválido'}`);
  }
}

function warnIf(name, predicate, message) {
  const value = get(name);
  if (!value) return;
  if (predicate(value)) warnings.push(`${name}: ${message}`);
}

function isUrl(v) {
  try {
    const u = new URL(v);
    return ['http:', 'https:', 'postgresql:', 'postgres:'].includes(u.protocol);
  } catch {
    return false;
  }
}

requireVar('DATABASE_URL', (v) => /^postgres(ql)?:\/\//i.test(v), 'debe ser una URL PostgreSQL');
requireVar('JWT_ACCESS_SECRET', (v) => v.length >= 16, 'muy corto (mínimo recomendado: 16)');
requireVar('JWT_REFRESH_SECRET', (v) => v.length >= 16, 'muy corto (mínimo recomendado: 16)');
requireVar('WEB_URL', isUrl, 'URL inválida');
requireVar('API_URL', isUrl, 'URL inválida');
requireVar('VITE_API_URL', isUrl, 'URL inválida');

warnIf('JWT_ACCESS_SECRET', (v) => v.includes('cambiar-por') || v.includes('default'), 'parece valor placeholder');
warnIf('JWT_REFRESH_SECRET', (v) => v.includes('cambiar-por') || v.includes('default'), 'parece valor placeholder');
warnIf('DATABASE_URL', (v) => /postgres:postgres@/i.test(v), 'usa credenciales por defecto (probablemente incorrectas en tu entorno)');
warnIf('WEB_URL', (v) => v.includes('localhost') || v.includes('127.0.0.1'), 'apunta a local (ok para desarrollo, cambiar en hosting)');
warnIf('API_URL', (v) => v.includes('localhost') || v.includes('127.0.0.1'), 'apunta a local (ok para desarrollo, cambiar en hosting)');
warnIf('VITE_API_URL', (v) => v.includes('localhost') || v.includes('127.0.0.1'), 'apunta a local (ok para desarrollo, cambiar en hosting)');

const corsOrigins = get('CORS_ORIGINS');
if (!corsOrigins) {
  warnings.push('CORS_ORIGINS: vacío (en dev está bien, en producción conviene restringir orígenes)');
} else {
  const parts = corsOrigins.split(',').map((s) => s.trim()).filter(Boolean);
  const invalid = parts.filter((p) => {
    try {
      new URL(p);
      return false;
    } catch {
      return true;
    }
  });
  if (invalid.length) {
    errors.push(`CORS_ORIGINS: contiene URLs inválidas (${invalid.join(', ')})`);
  } else {
    info.push(`CORS_ORIGINS: ${parts.length} origen(es) configurado(s)`);
  }
}

if (fs.existsSync(apiEnv)) {
  warnings.push('apps/api/.env existe; el canon es next-stack/.env. Eliminá o ignorá ese archivo para evitar divergencia.');
}

if (get('API_URL') && get('VITE_API_URL') && get('API_URL') !== get('VITE_API_URL')) {
  warnings.push('API_URL y VITE_API_URL no coinciden (puede ser intencional, pero revisalo)');
}

console.log('[env:check] Archivo leído:', fs.existsSync(rootEnv) ? rootEnv : '(no existe .env en next-stack)');

if (info.length) {
  console.log('[env:check] INFO');
  for (const line of info) console.log(` - ${line}`);
}

if (warnings.length) {
  console.log('[env:check] WARN');
  for (const line of warnings) console.log(` - ${line}`);
}

if (errors.length) {
  console.log('[env:check] FAIL');
  for (const line of errors) console.log(` - ${line}`);
  process.exit(1);
}

console.log('[env:check] OK');

