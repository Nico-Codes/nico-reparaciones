import { apiOrigin } from '@/features/auth/http';

type ClientErrorInput = {
  message: string;
  name?: string;
  stack?: string;
  componentStack?: string;
  path?: string;
  source: string;
};

let reportedCount = 0;
const MAX_REPORTS_PER_PAGE = 5;

function apiUrl(path: string) {
  return `${apiOrigin}/api${path}`;
}

export function reportClientError(input: ClientErrorInput) {
  if (reportedCount >= MAX_REPORTS_PER_PAGE) return;
  reportedCount += 1;

  const payload = {
    ...input,
    path: input.path ?? `${window.location.pathname}${window.location.search}`,
    userAgent: window.navigator.userAgent,
  };

  void fetch(apiUrl('/telemetry/client-error'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Telemetry must never break the user flow.
  });
}
