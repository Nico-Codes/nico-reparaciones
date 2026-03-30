import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();

const RUNTIME_DIRS = [
  path.join(ROOT, 'apps', 'web', 'src'),
  path.join(ROOT, 'apps', 'api', 'src'),
  path.join(ROOT, 'apps', 'web', 'public'),
];

const CONFIG_FILES = [
  path.join(ROOT, '.env'),
  path.join(ROOT, '.env.example'),
  path.join(ROOT, '.env.production'),
  path.join(ROOT, '.env.production.example'),
  path.join(ROOT, 'apps', 'web', '.env'),
  path.join(ROOT, 'apps', 'web', '.env.example'),
];

const BLOCKED_PATTERNS = [
  {
    label: 'Legacy host hardcoded',
    re: /https?:\/\/(?:127\.0\.0\.1|localhost):8000/gi,
  },
  {
    label: 'Legacy artisan command hardcoded',
    re: /\bphp\s+artisan\b/gi,
  },
];

const BLOCKED_ENV_KEYS = ['API_URL', 'VITE_API_URL', 'WEB_URL'];

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.git')) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(abs, out);
      continue;
    }
    out.push(abs);
  }
  return out;
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function scanContent(filePath, text, findings) {
  for (const pattern of BLOCKED_PATTERNS) {
    const matches = [...text.matchAll(pattern.re)];
    for (const match of matches) {
      const start = match.index ?? 0;
      const prefix = text.slice(0, start);
      const line = prefix.split('\n').length;
      findings.push({
        file: rel(filePath),
        line,
        label: pattern.label,
        value: String(match[0]),
      });
    }
  }
}

function scanEnvFile(filePath, findings) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const [rawKey, ...rest] = line.split('=');
    const key = rawKey.trim();
    if (!BLOCKED_ENV_KEYS.includes(key)) continue;
    const value = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
    if (/https?:\/\/(?:127\.0\.0\.1|localhost):8000/i.test(value)) {
      findings.push({
        file: rel(filePath),
        line: i + 1,
        label: 'Legacy URL in env',
        value: `${key}=${value}`,
      });
    }
  }
}

function main() {
  const findings = [];
  const scanned = [];

  for (const dir of RUNTIME_DIRS) {
    for (const filePath of walkFiles(dir)) {
      const ext = path.extname(filePath).toLowerCase();
      if (!['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss', '.html', '.svg'].includes(ext)) {
        continue;
      }
      const text = fs.readFileSync(filePath, 'utf8');
      scanned.push(rel(filePath));
      scanContent(filePath, text, findings);
    }
  }

  for (const envFile of CONFIG_FILES) {
    if (!fs.existsSync(envFile)) continue;
    scanned.push(rel(envFile));
    scanEnvFile(envFile, findings);
  }

  console.log('[qa:legacy:detach] Resumen');
  console.log(`- Archivos escaneados: ${scanned.length}`);
  console.log(`- Hallazgos bloqueantes: ${findings.length}`);

  if (findings.length > 0) {
    console.log('\n[qa:legacy:detach] Hallazgos');
    for (const finding of findings) {
      console.log(`- ${finding.file}:${finding.line} | ${finding.label} | ${finding.value}`);
    }
    process.exit(1);
  }

  console.log('\n[qa:legacy:detach] OK');
}

main();
