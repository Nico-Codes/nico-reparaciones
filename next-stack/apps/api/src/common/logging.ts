type LogLevel = 'log' | 'warn' | 'error';

function env(name: string) {
  return (process.env[name] ?? '').trim();
}

export function isTruthy(value: string) {
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export function getLogFormat(): 'plain' | 'json' {
  const format = env('LOG_FORMAT').toLowerCase();
  return format === 'json' ? 'json' : 'plain';
}

export function appLog(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const format = getLogFormat();
  if (format === 'json') {
    const payload = {
      level,
      message,
      ...(meta ?? {}),
      timestamp: new Date().toISOString(),
    };
    const line = JSON.stringify(payload);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
    return;
  }

  if (meta && Object.keys(meta).length > 0) {
    if (level === 'error') console.error(message, meta);
    else if (level === 'warn') console.warn(message, meta);
    else console.log(message, meta);
    return;
  }

  if (level === 'error') console.error(message);
  else if (level === 'warn') console.warn(message);
  else console.log(message);
}

