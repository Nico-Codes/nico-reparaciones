import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fileBasedCanonicalEnv = path.resolve(__dirname, '../../../.env');

export function resolveCanonicalEnvPaths() {
  const cwd = process.cwd();
  const candidates = [
    fileBasedCanonicalEnv,
    path.resolve(cwd, '.env'),
    path.resolve(cwd, '../../.env'),
  ];

  return Array.from(
    new Set(
      candidates.filter((candidate) => {
        if (!fs.existsSync(candidate)) return false;
        return !candidate.replace(/\\/g, '/').endsWith('/apps/api/.env');
      }),
    ),
  );
}

export function loadCanonicalEnv(options?: { override?: boolean }) {
  const envPaths = resolveCanonicalEnvPaths();
  for (const envPath of envPaths) {
    loadEnv({ path: envPath, override: options?.override ?? false });
  }
  return envPaths;
}
