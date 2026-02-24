import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { config as loadEnv } from 'dotenv';

const root = process.cwd();
const envProd = path.join(root, '.env.production');
const envRoot = path.join(root, '.env');
const source = fs.existsSync(envProd) ? envProd : envRoot;

if (fs.existsSync(source)) {
  loadEnv({ path: source, override: true });
}

const errors = [];
const warnings = [];
const info = [];

function get(name) {
  return (process.env[name] ?? '').trim();
}

function isHttpUrl(v) {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function isHttpsUrl(v) {
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
}

function isPgUrl(v) {
  try {
    const u = new URL(v);
    return u.protocol === 'postgresql:' || u.protocol === 'postgres:';
  } catch {
    return false;
  }
}

function requireVar(name, validator, invalidMsg) {
  const value = get(name);
  if (!value) {
    errors.push(`${name}: faltante`);
    return '';
  }
  if (validator && !validator(value)) {
    errors.push(`${name}: ${invalidMsg}`);
  }
  return value;
}

function isPlaceholderSecret(v) {
  const lower = v.toLowerCase();
  return lower.includes('cambiar') || lower.includes('placeholder') || lower.includes('default') || lower.includes('secret');
}

const databaseUrl = requireVar('DATABASE_URL', isPgUrl, 'debe ser URL PostgreSQL');
const jwtAccess = requireVar('JWT_ACCESS_SECRET', (v) => v.length >= 32, 'muy corto (mínimo recomendado: 32)');
const jwtRefresh = requireVar('JWT_REFRESH_SECRET', (v) => v.length >= 32, 'muy corto (mínimo recomendado: 32)');
const webUrl = requireVar('WEB_URL', isHttpUrl, 'URL inválida');
const apiUrl = requireVar('API_URL', isHttpUrl, 'URL inválida');
const viteApiUrl = requireVar('VITE_API_URL', isHttpUrl, 'URL inválida');
const corsOrigins = requireVar('CORS_ORIGINS', (v) => v.split(',').some(Boolean), 'debe contener al menos un origen');

if (jwtAccess && isPlaceholderSecret(jwtAccess)) errors.push('JWT_ACCESS_SECRET: parece placeholder');
if (jwtRefresh && isPlaceholderSecret(jwtRefresh)) errors.push('JWT_REFRESH_SECRET: parece placeholder');

if (databaseUrl) {
  if (/localhost|127\.0\.0\.1/i.test(databaseUrl)) warnings.push('DATABASE_URL: apunta a localhost (válido solo si el deploy corre en la misma máquina DB)');
  if (/postgres:postgres@/i.test(databaseUrl)) errors.push('DATABASE_URL: usa credenciales por defecto inseguras');
}

if (webUrl && !isHttpsUrl(webUrl)) warnings.push('WEB_URL: no usa https (recomendado/esperado en producción)');
if (apiUrl && !isHttpsUrl(apiUrl)) warnings.push('API_URL: no usa https (recomendado/esperado en producción)');
if (viteApiUrl && apiUrl && viteApiUrl !== apiUrl) warnings.push('VITE_API_URL y API_URL no coinciden (revisar si es intencional)');

if (corsOrigins) {
  const items = corsOrigins.split(',').map((s) => s.trim()).filter(Boolean);
  const invalid = [];
  for (const item of items) {
    try {
      const u = new URL(item);
      if (!['http:', 'https:'].includes(u.protocol)) invalid.push(item);
    } catch {
      invalid.push(item);
    }
  }
  if (invalid.length) {
    errors.push(`CORS_ORIGINS: URLs inválidas (${invalid.join(', ')})`);
  } else {
    info.push(`CORS_ORIGINS: ${items.length} origen(es)`);
  }
  if (items.some((i) => /localhost|127\.0\.0\.1/i.test(i))) {
    warnings.push('CORS_ORIGINS: contiene origen local');
  }
}

const smtpHost = get('SMTP_HOST');
const smtpPort = get('SMTP_PORT');
const smtpUser = get('SMTP_USER');
const smtpPass = get('SMTP_PASS');
if (smtpHost || smtpPort || smtpUser || smtpPass) {
  if (!smtpHost || !smtpPort) errors.push('SMTP: si configurás correo, al menos SMTP_HOST y SMTP_PORT son obligatorios');
  if (smtpPort && !/^\d+$/.test(smtpPort)) errors.push('SMTP_PORT: debe ser numérico');
  if (smtpHost && smtpHost.includes('localhost')) warnings.push('SMTP_HOST: apunta a localhost');
} else {
  warnings.push('SMTP no configurado: verify/reset/order mails usarán fallback local (no apto producción)');
}

const bootstrapKey = get('ADMIN_BOOTSTRAP_KEY');
if (bootstrapKey) {
  warnings.push('ADMIN_BOOTSTRAP_KEY está presente: asegurá que bootstrap admin no quede expuesto en producción');
}
const allowBootstrap = get('ALLOW_ADMIN_BOOTSTRAP');
if (allowBootstrap && ['1', 'true'].includes(allowBootstrap.toLowerCase())) {
  errors.push('ALLOW_ADMIN_BOOTSTRAP: no debería estar habilitado en producción');
}
const previewTokens = get('MAIL_PREVIEW_TOKENS');
if (previewTokens && ['1', 'true'].includes(previewTokens.toLowerCase())) {
  errors.push('MAIL_PREVIEW_TOKENS: deshabilitalo en producción');
}
const allowDemoSeed = get('ALLOW_DEMO_SEED');
if (allowDemoSeed && ['1', 'true'].includes(allowDemoSeed.toLowerCase())) {
  errors.push('ALLOW_DEMO_SEED: deshabilitalo en producción');
}
const logHttp = get('LOG_HTTP_REQUESTS');
if (logHttp && !['0', '1', 'true', 'false'].includes(logHttp.toLowerCase())) {
  errors.push('LOG_HTTP_REQUESTS: usar 0/1 o true/false');
}
const logFormat = get('LOG_FORMAT');
if (logFormat && !['plain', 'json'].includes(logFormat.toLowerCase())) {
  errors.push('LOG_FORMAT: usar plain o json');
}

console.log('[deploy:check] Archivo leído:', fs.existsSync(source) ? source : '(ninguno)');
if (info.length) {
  console.log('[deploy:check] INFO');
  for (const line of info) console.log(` - ${line}`);
}
if (warnings.length) {
  console.log('[deploy:check] WARN');
  for (const line of warnings) console.log(` - ${line}`);
}
if (errors.length) {
  console.log('[deploy:check] FAIL');
  for (const line of errors) console.log(` - ${line}`);
  process.exit(1);
}
console.log('[deploy:check] OK');
