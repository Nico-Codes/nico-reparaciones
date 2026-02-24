const baseUrl = (process.env.SMOKE_API_URL || process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
const endpoints = ['/api/health', '/api/health/live', '/api/health/ready', '/api/health/info'];

try {
  for (const path of endpoints) {
    const url = `${baseUrl}${path}`;
    const startedAt = Date.now();
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    const elapsed = Date.now() - startedAt;

    if (!res.ok || data?.ok !== true) {
      console.error('[smoke:api] FAIL', { url, status: res.status, data, elapsedMs: elapsed });
      process.exit(1);
    }

    console.log('[smoke:api] OK', {
      url,
      status: res.status,
      elapsedMs: elapsed,
      statusLabel: data.status ?? 'ok',
      service: data.service,
    });
  }
} catch (error) {
  console.error('[smoke:api] ERROR', {
    baseUrl,
    message: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
}
