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

function runNpm(commandLine) {
  if (isWindows) return run('cmd.exe', ['/d', '/s', '/c', commandLine]);
  return run('npm', commandLine.replace(/^npm\s+/, '').split(/\s+/));
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

async function waitFor(url, timeoutMs = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (res.ok && /<div id="root"><\/div>|<div id="root">/i.test(text)) {
        return { ok: true, status: res.status };
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return { ok: false };
}

async function main() {
  console.log('[smoke:web] Paso 1/3: build web');
  if ((await runNpm('npm run build --workspace @nico/web')) !== 0) process.exit(1);

  console.log('[smoke:web] Paso 2/3: iniciar preview');
  const previewCmd = isWindows ? 'cmd.exe' : 'npm';
  const previewArgs = isWindows
    ? ['/d', '/s', '/c', 'npm run preview --workspace @nico/web -- --host 127.0.0.1']
    : ['run', 'preview', '--workspace', '@nico/web', '--', '--host', '127.0.0.1'];

  const previewProc = spawn(previewCmd, previewArgs, {
    cwd,
    stdio: 'inherit',
    shell: false,
  });

  const baseUrl = (process.env.SMOKE_WEB_URL || 'http://127.0.0.1:4174').replace(/\/$/, '');
  const ready = await waitFor(baseUrl, 45_000);
  if (!ready.ok) {
    console.error('[smoke:web] FAIL: preview no respondió a tiempo');
    await killProcessTree(previewProc.pid);
    process.exit(1);
  }

  console.log('[smoke:web] Paso 3/3: validar rutas');
  const routes = ['/', '/store', '/help', '/auth/login'];
  for (const route of routes) {
    const res = await fetch(`${baseUrl}${route}`);
    const text = await res.text();
    if (!res.ok) {
      console.error('[smoke:web] FAIL', { route, status: res.status });
      await killProcessTree(previewProc.pid);
      process.exit(1);
    }
    if (!/<div id="root"><\/div>|<div id="root">/i.test(text)) {
      console.error('[smoke:web] FAIL', { route, message: 'HTML sin root esperado' });
      await killProcessTree(previewProc.pid);
      process.exit(1);
    }
    console.log('[smoke:web] OK route', route);
  }

  await killProcessTree(previewProc.pid);
  console.log('[smoke:web] OK');
}

main().catch(async (err) => {
  console.error('[smoke:web] ERROR', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
