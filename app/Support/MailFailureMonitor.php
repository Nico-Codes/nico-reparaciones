<?php

namespace App\Support;

use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class MailFailureMonitor
{
    /**
     * @param  array<string, mixed>  $context
     */
    public function reportSyncFailure(Throwable $exception, array $context = []): void
    {
        $this->emit('sync_send', $exception, $context);
    }

    public function reportQueueFailure(JobFailed $event): void
    {
        if (! $this->alertsEnabled()) {
            return;
        }

        $jobName = $this->safeResolveJobName($event);
        $payload = $this->safePayload($event);

        if (! $this->isMailRelatedJob($jobName, $payload)) {
            return;
        }

        $this->emit('queue_failed', $event->exception, [
            'queue_job' => $jobName,
            'queue' => $event->job->getQueue(),
            'connection' => $event->connectionName,
            'job_id' => $event->job->getJobId(),
            'command_name' => (string) data_get($payload, 'data.commandName', ''),
        ]);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function emit(string $source, Throwable $exception, array $context): void
    {
        $payload = array_merge($context, [
            'source' => $source,
            'exception_class' => $exception::class,
            'error' => Str::limit(str_replace(["\r", "\n"], ' ', $exception->getMessage()), 300),
            'environment' => app()->environment(),
            'mailer' => (string) config('mail.default', ''),
        ]);

        Log::warning('Mail delivery failed.', $payload);

        if (! $this->alertsEnabled()) {
            return;
        }

        if (! $this->passesDedupeWindow($payload)) {
            return;
        }

        $channel = trim((string) config('monitoring.alerts.channel', 'ops_alerts'));
        if ($channel === '') {
            return;
        }

        try {
            Log::channel($channel)->critical('Mail delivery failed.', $payload);
        } catch (Throwable) {
            // Mail monitoring should never break request/worker flow.
        }
    }

    private function alertsEnabled(): bool
    {
        return (bool) config('ops.mail.alerts_on_failure', true)
            && (bool) config('monitoring.alerts.enabled', true);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function passesDedupeWindow(array $payload): bool
    {
        $minutes = max(0, (int) config('monitoring.alerts.dedupe_minutes', 10));
        if ($minutes === 0) {
            return true;
        }

        $fingerprint = implode('|', [
            (string) ($payload['source'] ?? ''),
            (string) ($payload['queue_job'] ?? ''),
            (string) ($payload['command_name'] ?? ''),
            (string) ($payload['exception_class'] ?? ''),
            (string) ($payload['error'] ?? ''),
            (string) ($payload['queue'] ?? ''),
            (string) ($payload['connection'] ?? ''),
        ]);

        $key = 'monitoring:mail_failure:'.sha1($fingerprint);
        try {
            return Cache::add($key, '1', now()->addMinutes($minutes));
        } catch (Throwable) {
            return true;
        }
    }

    private function safeResolveJobName(JobFailed $event): string
    {
        try {
            return (string) $event->job->resolveName();
        } catch (Throwable) {
            return '';
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function safePayload(JobFailed $event): array
    {
        try {
            $payload = $event->job->payload();

            return is_array($payload) ? $payload : [];
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function isMailRelatedJob(string $jobName, array $payload): bool
    {
        $jobName = Str::lower($jobName);
        if (str_contains($jobName, 'sendqueuedmailable')) {
            return true;
        }

        if (! str_contains($jobName, 'sendqueuednotifications')) {
            return false;
        }

        $commandName = Str::lower((string) data_get($payload, 'data.commandName', ''));
        if (str_contains($commandName, 'sendqueuednotifications')) {
            return true;
        }

        $serializedCommand = Str::lower((string) data_get($payload, 'data.command', ''));

        return str_contains($serializedCommand, 'verifyemailnotification')
            || str_contains($serializedCommand, 'resetpasswordnotification');
    }
}
