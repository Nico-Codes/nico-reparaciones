import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, openSync, closeSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const envFile = join(root, '.env');
const envExampleFile = join(root, '.env.example');
const sqliteDir = join(root, 'database');
const sqliteFile = join(sqliteDir, 'e2e.sqlite');

if (!existsSync(envFile) && existsSync(envExampleFile)) {
  copyFileSync(envExampleFile, envFile);
}

if (!existsSync(sqliteDir)) {
  mkdirSync(sqliteDir, { recursive: true });
}

if (!existsSync(sqliteFile)) {
  const fd = openSync(sqliteFile, 'w');
  closeSync(fd);
}

const phpCandidates = [
  process.env.PHP_BIN,
  'C:\\xampp\\php\\php.exe',
  'php',
].filter(Boolean);

const phpBin = phpCandidates.find((bin) => bin === 'php' || existsSync(bin)) || 'php';

const sharedEnv = {
  ...process.env,
  APP_ENV: 'testing',
  APP_DEBUG: 'false',
  APP_URL: 'http://127.0.0.1:8001',
  DB_CONNECTION: 'sqlite',
  DB_DATABASE: sqliteFile,
  CACHE_STORE: 'file',
  ADMIN_COUNTERS_CACHE_STORE: 'file',
  QUEUE_CONNECTION: 'database',
  SESSION_DRIVER: 'file',
  MAIL_MAILER: 'array',
  BROADCAST_CONNECTION: 'log',
  ADMIN_EMAIL: process.env.E2E_ADMIN_EMAIL || 'admin@nico.local',
  ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD || 'admin1234',
  ADMIN_ALLOWED_EMAILS: process.env.E2E_ADMIN_EMAIL || 'admin@nico.local',
  ADMIN_2FA_SESSION_MINUTES: '0',
  RATE_LIMIT_AUTH_LOGIN_PER_MINUTE: '120',
};

const runArtisan = (args) => {
  const result = spawnSync(phpBin, ['artisan', ...args], {
    stdio: 'inherit',
    env: sharedEnv,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

runArtisan(['migrate:fresh', '--force']);
runArtisan(['cache:clear']);
runArtisan(['config:clear']);
runArtisan(['db:seed', '--class=Database\\Seeders\\DatabaseSeeder', '--force']);
runArtisan(['db:seed', '--class=Database\\Seeders\\CategoryProductSeeder', '--force']);
runArtisan(['db:seed', '--class=Database\\Seeders\\AdminUserSeeder', '--force']);
runArtisan(['db:seed', '--class=Database\\Seeders\\E2eSmokeSeeder', '--force']);

const server = spawn(
  phpBin,
  ['artisan', 'serve', '--host=127.0.0.1', '--port=8001'],
  {
    stdio: 'inherit',
    env: sharedEnv,
  }
);

const shutdown = () => {
  if (!server.killed) {
    server.kill();
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.on('exit', (code) => {
  process.exit(code ?? 0);
});
