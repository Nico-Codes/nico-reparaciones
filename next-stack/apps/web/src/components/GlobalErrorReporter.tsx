import { useEffect } from 'react';
import { reportClientError } from '@/lib/client-telemetry';

export function GlobalErrorReporter() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      reportClientError({
        message: event.message || 'Unhandled window error',
        name: event.error instanceof Error ? event.error.name : 'ErrorEvent',
        stack: event.error instanceof Error ? event.error.stack : undefined,
        source: 'window-error',
      });
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      reportClientError({
        message: reason instanceof Error ? reason.message : String(reason ?? 'Unhandled promise rejection'),
        name: reason instanceof Error ? reason.name : 'UnhandledRejection',
        stack: reason instanceof Error ? reason.stack : undefined,
        source: 'unhandled-rejection',
      });
    }

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
