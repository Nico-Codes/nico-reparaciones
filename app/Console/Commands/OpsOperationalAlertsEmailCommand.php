<?php

namespace App\Console\Commands;

use App\Mail\AdminOperationalAlertsMail;
use App\Models\BusinessSetting;
use App\Models\Order;
use App\Models\Repair;
use App\Models\User;
use App\Support\MailDispatch;
use App\Support\MailFailureMonitor;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Throwable;

class OpsOperationalAlertsEmailCommand extends Command
{
    protected $signature = 'ops:operational-alerts-email
        {--to= : Recipients (comma separated)}
        {--force : Send even if signature did not change}
        {--dry-run : Build and print summary without sending}';

    protected $description = 'Send operational stale alerts for orders/repairs to admins.';

    private const SETTING_LAST_SIGNATURE = 'ops_operational_alerts_last_signature';
    private const SETTING_LAST_SENT_AT = 'ops_operational_alerts_last_sent_at';

    public function handle(): int
    {
        $orderThresholdHours = $this->resolveOrderThresholdHours();
        $repairThresholdDays = $this->resolveRepairThresholdDays();
        $dedupeMinutes = $this->resolveDedupeMinutes();

        $orderStatuses = [
            'pendiente' => 'Pendiente',
            'confirmado' => 'Confirmado',
            'preparando' => 'Preparando',
        ];
        $repairStatuses = [
            'received' => 'Recibido',
            'diagnosing' => 'Diagnosticando',
            'waiting_approval' => 'Esperando aprobacion',
            'repairing' => 'En reparacion',
        ];

        $orders = Order::query()
            ->whereIn('status', array_keys($orderStatuses))
            ->where('created_at', '<', now()->copy()->subHours($orderThresholdHours))
            ->select(['id', 'status', 'pickup_name', 'created_at'])
            ->orderBy('created_at')
            ->limit(30)
            ->get()
            ->map(function (Order $order) use ($orderStatuses): array {
                return [
                    'id' => (int) $order->id,
                    'status' => (string) $order->status,
                    'status_label' => (string) ($orderStatuses[$order->status] ?? $order->status),
                    'pickup_name' => (string) ($order->pickup_name ?? ''),
                    'created_at' => optional($order->created_at)->toIso8601String(),
                    'age_human' => $order->created_at?->diffForHumans(),
                ];
            })
            ->values()
            ->all();

        $repairs = Repair::query()
            ->whereIn('status', array_keys($repairStatuses))
            ->where('created_at', '<', now()->copy()->subDays($repairThresholdDays))
            ->select(['id', 'code', 'status', 'customer_name', 'created_at'])
            ->orderBy('created_at')
            ->limit(30)
            ->get()
            ->map(function (Repair $repair) use ($repairStatuses): array {
                return [
                    'id' => (int) $repair->id,
                    'code' => (string) ($repair->code ?? ''),
                    'status' => (string) $repair->status,
                    'status_label' => (string) ($repairStatuses[$repair->status] ?? $repair->status),
                    'customer_name' => (string) ($repair->customer_name ?? ''),
                    'created_at' => optional($repair->created_at)->toIso8601String(),
                    'age_human' => $repair->created_at?->diffForHumans(),
                ];
            })
            ->values()
            ->all();

        $ordersCount = count($orders);
        $repairsCount = count($repairs);
        $totalAlerts = $ordersCount + $repairsCount;

        if ($totalAlerts <= 0) {
            $this->line('No operational alerts at this time.');
            return self::SUCCESS;
        }

        $signature = sha1(json_encode([
            'orders' => array_map(fn (array $item): array => [$item['id'], $item['status']], $orders),
            'repairs' => array_map(fn (array $item): array => [$item['id'], $item['status']], $repairs),
            'order_threshold_h' => $orderThresholdHours,
            'repair_threshold_d' => $repairThresholdDays,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        $lastSignature = (string) BusinessSetting::getValue(self::SETTING_LAST_SIGNATURE, '');
        $lastSentAtRaw = (string) BusinessSetting::getValue(self::SETTING_LAST_SENT_AT, '');
        $lastSentAt = $lastSentAtRaw !== '' ? Carbon::parse($lastSentAtRaw) : null;
        $isWithinDedupeWindow = $lastSentAt !== null && $lastSentAt->gt(now()->copy()->subMinutes($dedupeMinutes));
        $changedSignature = !hash_equals($lastSignature, $signature);
        $forceSend = (bool) $this->option('force');

        if (!$forceSend && !$changedSignature && $isWithinDedupeWindow) {
            $this->line('Skipped (dedupe): same signature still within dedupe window.');
            return self::SUCCESS;
        }

        $recipients = $this->resolveRecipients((string) ($this->option('to') ?? ''));
        if ($recipients === []) {
            $this->error('No recipients found for operational alerts.');
            return self::FAILURE;
        }

        if ((bool) $this->option('dry-run')) {
            $this->line('Dry-run operational alerts');
            $this->line('Recipients: '.implode(', ', $recipients));
            $this->line('Orders: '.$ordersCount.' | Repairs: '.$repairsCount);
            return self::SUCCESS;
        }

        try {
            MailDispatch::send($recipients, new AdminOperationalAlertsMail(
                $orderThresholdHours,
                $repairThresholdDays,
                $ordersCount,
                $repairsCount,
                $orders,
                $repairs
            ));
        } catch (Throwable $e) {
            app(MailFailureMonitor::class)->reportSyncFailure($e, [
                'event' => 'ops.operational_alerts',
                'orders_count' => $ordersCount,
                'repairs_count' => $repairsCount,
                'recipients_count' => count($recipients),
            ]);
            $this->error('Could not send operational alerts: '.$e->getMessage());
            return self::FAILURE;
        }

        $this->persistSetting(self::SETTING_LAST_SIGNATURE, $signature);
        $this->persistSetting(self::SETTING_LAST_SENT_AT, now()->toDateTimeString());

        $verb = MailDispatch::asyncEnabled() ? 'queued for' : 'sent to';
        $this->info('Operational alerts '.$verb.': '.implode(', ', $recipients));

        return self::SUCCESS;
    }

    private function resolveOrderThresholdHours(): int
    {
        $value = (int) BusinessSetting::getValue('ops_alert_order_stale_hours', '24');
        return max(1, min(720, $value));
    }

    private function resolveRepairThresholdDays(): int
    {
        $value = (int) BusinessSetting::getValue('ops_alert_repair_stale_days', '3');
        return max(1, min(180, $value));
    }

    private function resolveDedupeMinutes(): int
    {
        $configValue = (int) config('ops.alerts.operational_dedupe_minutes', 360);
        return max(5, min(10080, $configValue));
    }

    /**
     * @return array<int, string>
     */
    private function resolveRecipients(string $toOption): array
    {
        $fromOption = $this->parseEmails($toOption);
        if ($fromOption !== []) {
            return $fromOption;
        }

        $configured = (string) config('ops.alerts.operational_email_recipients', '');
        $fromConfig = $this->parseEmails($configured);
        if ($fromConfig !== []) {
            return $fromConfig;
        }

        $fromWeekly = $this->parseEmails((string) BusinessSetting::getValue('ops_weekly_report_emails', ''));
        if ($fromWeekly !== []) {
            return $fromWeekly;
        }

        return User::query()
            ->where('role', 'admin')
            ->whereNotNull('email')
            ->where('email', '!=', '')
            ->orderBy('id')
            ->pluck('email')
            ->map(static fn (string $email): string => trim(strtolower($email)))
            ->filter(static fn (string $email): bool => filter_var($email, FILTER_VALIDATE_EMAIL) !== false)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
    private function parseEmails(string $raw): array
    {
        $items = array_values(array_filter(array_map(
            static fn (string $value): string => trim(strtolower($value)),
            explode(',', $raw)
        )));

        $valid = array_values(array_filter($items, static fn (string $email): bool => filter_var($email, FILTER_VALIDATE_EMAIL) !== false));
        return array_values(array_unique($valid));
    }

    private function persistSetting(string $key, string $value): void
    {
        BusinessSetting::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }
}
