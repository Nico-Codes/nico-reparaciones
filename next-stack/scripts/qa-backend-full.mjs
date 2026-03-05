import { spawn } from 'node:child_process';
import process from 'node:process';

const cwd = process.cwd();
const isWindows = process.platform === 'win32';

function run(command, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: false,
      ...opts,
    });
    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', () => resolve(1));
  });
}

function runNpmScript(scriptName) {
  const cmd = isWindows ? 'cmd.exe' : 'npm';
  const args = isWindows ? ['/d', '/s', '/c', `npm run ${scriptName}`] : ['run', scriptName];
  return run(cmd, args);
}

async function waitForHealth(url, timeoutMs = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok === true) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function freePort3001OnWindows() {
  if (!isWindows) return;
  const pid = await new Promise((resolve) => {
    let out = '';
    const child = spawn('cmd.exe', ['/d', '/s', '/c', 'netstat -ano | findstr :3001'], {
      cwd,
      shell: false,
    });
    child.stdout.on('data', (d) => {
      out += d.toString();
    });
    child.on('close', () => {
      const lines = out
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .filter((l) => /\sLISTENING\s/i.test(l));
      if (!lines.length) return resolve(null);
      const last = lines[0].split(/\s+/).at(-1);
      resolve(last && /^\d+$/.test(last) ? Number(last) : null);
    });
    child.on('error', () => resolve(null));
  });
  if (!pid) return;
  console.warn(`[qa:backend:full] WARN: puerto 3001 ocupado por PID ${pid}. Cerrando proceso previo...`);
  await new Promise((resolve) => {
    const killer = spawn('taskkill', ['/PID', String(pid), '/F'], {
      cwd,
      stdio: 'inherit',
      shell: false,
    });
    killer.on('close', () => resolve());
    killer.on('error', () => resolve());
  });
}

async function killProcessTree(pid) {
  if (!pid) return;
  if (isWindows) {
    await new Promise((resolve) => {
      const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
        cwd,
        stdio: 'inherit',
        shell: false,
      });
      killer.on('close', () => resolve());
      killer.on('error', () => resolve());
    });
    return;
  }
  try {
    process.kill(pid, 'SIGTERM');
  } catch {}
}

async function main() {
  console.log('[qa:backend:full] Paso 1/6: db:check');
  if ((await runNpmScript('db:check')) !== 0) process.exit(1);

  console.log('[qa:backend:full] Paso 2/6: db:generate');
  const generateCode = await runNpmScript('db:generate');
  if (generateCode !== 0) {
    console.warn('[qa:backend:full] WARN: db:generate failed (possible Prisma file lock on Windows). Continuing QA.');
  }

  console.log('[qa:backend:full] Paso 3/6: db:migrate (deploy)');
  const migrateCode = await runNpmScript('db:migrate');
  if (migrateCode !== 0) {
    console.warn('[qa:backend:full] WARN: db:migrate failed. Trying fallback db:push (legacy/local PostgreSQL compatibility).');
    if ((await runNpmScript('db:push:skip-generate')) !== 0) process.exit(1);
  }

  console.log('[qa:backend:full] Paso 4/6: db:seed');
  if ((await runNpmScript('db:seed')) !== 0) process.exit(1);

  console.log('[qa:backend:full] Paso 5/6: iniciar API');
  await freePort3001OnWindows();
  const apiCmd = isWindows ? 'cmd.exe' : 'npm';
  const apiArgs = isWindows ? ['/d', '/s', '/c', 'npm run dev:api'] : ['run', 'dev:api'];
  const apiProc = spawn(apiCmd, apiArgs, {
    cwd,
    stdio: 'inherit',
    shell: false,
  });

  const apiUrl = (process.env.SMOKE_API_URL || process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
  const healthy = await waitForHealth(`${apiUrl}/api/health`, 45_000);
  if (!healthy) {
    console.error('[qa:backend:full] FAIL: API did not answer health in time');
    await killProcessTree(apiProc.pid);
    process.exit(1);
  }

  console.log('[qa:backend:full] Paso 6/6: smoke:backend');
  const smokeCode = await runNpmScript('smoke:backend');

  await killProcessTree(apiProc.pid);
  if (smokeCode !== 0) process.exit(smokeCode);

  console.log('[qa:backend:full] OK');
}

main().catch((err) => {
  console.error('[qa:backend:full] ERROR', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
