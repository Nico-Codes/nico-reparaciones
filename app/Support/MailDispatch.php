<?php

namespace App\Support;

use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Mail;

class MailDispatch
{
    public static function asyncEnabled(): bool
    {
        return (bool) config('ops.mail.async_enabled', false);
    }

    public static function queueName(): string
    {
        $queue = trim((string) config('ops.mail.queue', 'mail'));

        return $queue !== '' ? $queue : 'mail';
    }

    public static function queueConnection(): ?string
    {
        $connection = trim((string) config('ops.mail.queue_connection', ''));

        return $connection !== '' ? $connection : null;
    }

    public static function tries(): int
    {
        return max(1, (int) config('ops.mail.tries', 3));
    }

    /**
     * @return array<int, int>
     */
    public static function backoffSeconds(): array
    {
        $raw = (string) config('ops.mail.backoff_seconds', '60,300,900');

        $values = [];
        foreach (explode(',', $raw) as $item) {
            $candidate = trim($item);
            if ($candidate === '' || ! preg_match('/^\d+$/', $candidate)) {
                continue;
            }

            $seconds = (int) $candidate;
            if ($seconds >= 0) {
                $values[] = $seconds;
            }
        }

        if ($values === []) {
            return [60, 300, 900];
        }

        return array_values(array_unique($values));
    }

    public static function applyQueueMetadata(object $queueable): void
    {
        if (method_exists($queueable, 'onQueue')) {
            $queueable->onQueue(self::queueName());
        }

        $connection = self::queueConnection();
        if ($connection !== null && method_exists($queueable, 'onConnection')) {
            $queueable->onConnection($connection);
        }
    }

    public static function send(string|array $to, Mailable $mailable): void
    {
        if (self::asyncEnabled()) {
            self::applyQueueMetadata($mailable);
            Mail::to($to)->queue($mailable);

            return;
        }

        Mail::to($to)->send($mailable);
    }
}
