<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class ExceptionMonitor
{
    public function report(Throwable $exception, ?Request $request = null): void
    {
        if (! (bool) config('monitoring.enabled', true)) {
            return;
        }

        if (! $this->shouldHandle($exception)) {
            return;
        }

        $this->captureInSentryIfAvailable($exception);
        $this->emitOpsAlert($exception, $request);
    }

    private function shouldHandle(Throwable $exception): bool
    {
        $ignored = (array) config('monitoring.ignore_exceptions', []);
        foreach ($ignored as $className) {
            if (is_string($className) && $className !== '' && is_a($exception, $className)) {
                return false;
            }
        }

        if ($exception instanceof HttpExceptionInterface) {
            $ignoredStatuses = array_map('intval', (array) config('monitoring.ignore_http_statuses', []));
            if (in_array($exception->getStatusCode(), $ignoredStatuses, true)) {
                return false;
            }
        }

        return true;
    }

    private function captureInSentryIfAvailable(Throwable $exception): void
    {
        $dsn = trim((string) config('monitoring.sentry.dsn', ''));
        if ($dsn === '') {
            return;
        }

        try {
            if (app()->bound('sentry')) {
                $hub = app('sentry');
                if (is_object($hub) && method_exists($hub, 'captureException')) {
                    $hub->captureException($exception);

                    return;
                }
            }

            if (function_exists('Sentry\\captureException')) {
                \Sentry\captureException($exception);
            }
        } catch (Throwable) {
            // Monitoring must never break the request lifecycle.
        }
    }

    private function emitOpsAlert(Throwable $exception, ?Request $request): void
    {
        if (! (bool) config('monitoring.alerts.enabled', true)) {
            return;
        }

        if (! $this->passesDedupeWindow($exception, $request)) {
            return;
        }

        $channel = (string) config('monitoring.alerts.channel', 'ops_alerts');
        if ($channel === '') {
            return;
        }

        $message = sprintf('Unhandled exception: %s', $exception::class);
        $context = $this->buildContext($exception, $request);

        try {
            Log::channel($channel)->critical($message, $context);
        } catch (Throwable) {
            // Never escalate logging failures.
        }
    }

    private function passesDedupeWindow(Throwable $exception, ?Request $request): bool
    {
        $minutes = max(0, (int) config('monitoring.alerts.dedupe_minutes', 10));
        if ($minutes === 0) {
            return true;
        }

        $fingerprint = implode('|', [
            $exception::class,
            $exception->getMessage(),
            $exception->getFile(),
            (string) $exception->getLine(),
            $request?->path() ?? '',
        ]);

        $key = 'monitoring:alert:'.sha1($fingerprint);
        try {
            return Cache::add($key, '1', now()->addMinutes($minutes));
        } catch (Throwable) {
            return true;
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function buildContext(Throwable $exception, ?Request $request): array
    {
        $userId = null;

        try {
            $userId = $request?->user()?->id;
        } catch (Throwable) {
            $userId = null;
        }

        return [
            'exception_class' => $exception::class,
            'message' => Str::limit(str_replace(["\r", "\n"], ' ', $exception->getMessage()), 300),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'url' => $request?->fullUrl(),
            'method' => $request?->method(),
            'ip' => $request?->ip(),
            'user_id' => $userId,
            'environment' => app()->environment(),
        ];
    }
}
