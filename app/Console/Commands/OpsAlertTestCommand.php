<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

class OpsAlertTestCommand extends Command
{
    protected $signature = 'ops:alert-test
        {--message= : Custom alert message}
        {--channel= : Override monitoring alert channel}';

    protected $description = 'Emit a synthetic critical alert to validate monitoring channels.';

    public function handle(): int
    {
        $channel = trim((string) ($this->option('channel') ?: config('monitoring.alerts.channel', 'ops_alerts')));
        if ($channel === '') {
            $this->error('Alert channel is empty. Configure OPS_ALERTS_CHANNEL.');

            return self::FAILURE;
        }

        $message = trim((string) $this->option('message'));
        if ($message === '') {
            $message = 'Synthetic ops alert test from NicoReparaciones.';
        }

        try {
            Log::channel($channel)->critical($message, [
                'source' => 'ops:alert-test',
                'environment' => app()->environment(),
                'app_url' => config('app.url'),
            ]);
        } catch (Throwable $e) {
            $this->error('Failed to write alert on channel `'.$channel.'`: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info('Alert sent through channel `'.$channel.'`.');

        return self::SUCCESS;
    }
}
