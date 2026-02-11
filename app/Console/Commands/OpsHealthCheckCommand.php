<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

class OpsHealthCheckCommand extends Command
{
    protected $signature = 'ops:health-check
        {--strict : Exit with failure when warnings are detected}';

    protected $description = 'Run operational checks for production readiness.';

    /**
     * @var array<int, array{status:string,check:string,details:string}>
     */
    private array $rows = [];

    public function handle(): int
    {
        $strict = (bool) $this->option('strict');
        $isProduction = app()->environment('production');

        $this->rows = [];

        $this->checkAppKey();
        $this->checkAppDebug($isProduction);
        $this->checkAppUrl($isProduction);
        $this->checkSecurityHeaders($isProduction);
        $this->checkSessionCookieSecurity($isProduction);
        $this->checkAdminRestrictions();
        $this->checkRateLimits();
        $this->checkTwoFactorSessionWindow();
        $this->checkMonitoring($isProduction);
        $this->checkWeeklyReportSetup($isProduction);

        $databaseReady = $this->checkDatabaseConnection();
        if ($databaseReady) {
            $this->checkCoreTables();
        } else {
            $this->addRow('WARN', 'Core tables', 'Skipped because database connection failed.');
        }

        $this->checkCacheStore('cache.default', (string) config('cache.default', ''));
        $this->checkCacheStore('cache.admin_counters_store', (string) config('cache.admin_counters_store', ''));
        $this->checkQueueDriver($isProduction);
        $this->checkWritablePath('storage', storage_path());
        $this->checkWritablePath('bootstrap/cache', base_path('bootstrap/cache'));
        $this->checkOptimizeCaches($isProduction);

        $this->renderReport();

        $summary = $this->summarize();
        $hasFail = $summary['fail'] > 0;
        $hasWarn = $summary['warn'] > 0;

        if ($hasFail || ($strict && $hasWarn)) {
            return self::FAILURE;
        }

        return self::SUCCESS;
    }

    private function checkAppKey(): void
    {
        $appKey = trim((string) config('app.key', ''));
        if ($appKey === '' || $appKey === 'base64:') {
            $this->addRow('FAIL', 'APP_KEY', 'APP_KEY is missing. Generate one with `php artisan key:generate`.');

            return;
        }

        $this->addRow('OK', 'APP_KEY', 'Configured.');
    }

    private function checkAppDebug(bool $isProduction): void
    {
        $debug = (bool) config('app.debug', false);
        if ($isProduction && $debug) {
            $this->addRow('FAIL', 'APP_DEBUG', 'APP_DEBUG must be false in production.');

            return;
        }

        if (! $isProduction && $debug) {
            $this->addRow('WARN', 'APP_DEBUG', 'Enabled (expected in local/dev, disable in production).');

            return;
        }

        $this->addRow('OK', 'APP_DEBUG', 'Safe value.');
    }

    private function checkAppUrl(bool $isProduction): void
    {
        $appUrl = trim((string) config('app.url', ''));
        if ($appUrl === '') {
            $this->addRow('FAIL', 'APP_URL', 'APP_URL is empty.');

            return;
        }

        if ($isProduction && ! Str::startsWith(Str::lower($appUrl), 'https://')) {
            $this->addRow('FAIL', 'APP_URL', 'Production APP_URL must use HTTPS.');

            return;
        }

        $this->addRow('OK', 'APP_URL', $appUrl);
    }

    private function checkSecurityHeaders(bool $isProduction): void
    {
        $headersEnabled = (bool) config('security.headers.enabled', true);
        $cspEnabled = (bool) config('security.headers.csp_enabled', true);

        if (! $headersEnabled) {
            $this->addRow(
                $isProduction ? 'FAIL' : 'WARN',
                'Security headers',
                'Disabled. Enable SECURITY_HEADERS_ENABLED=true.'
            );
        } else {
            $this->addRow('OK', 'Security headers', 'Enabled.');
        }

        if (! $cspEnabled) {
            $this->addRow(
                $isProduction ? 'WARN' : 'WARN',
                'Content-Security-Policy',
                'Disabled. Enable SECURITY_CSP_ENABLED=true.'
            );
        } else {
            $this->addRow('OK', 'Content-Security-Policy', 'Enabled.');
        }
    }

    private function checkSessionCookieSecurity(bool $isProduction): void
    {
        $secureCookie = (bool) config('session.secure', false);
        if ($isProduction && ! $secureCookie) {
            $this->addRow('FAIL', 'SESSION_SECURE_COOKIE', 'Must be true in production.');

            return;
        }

        if (! $secureCookie) {
            $this->addRow('WARN', 'SESSION_SECURE_COOKIE', 'False (acceptable in local HTTP only).');

            return;
        }

        $this->addRow('OK', 'SESSION_SECURE_COOKIE', 'Enabled.');
    }

    private function checkAdminRestrictions(): void
    {
        $allowedEmails = $this->parseCsv((string) config('security.admin.allowed_emails', ''));
        $allowedIps = $this->parseCsv((string) config('security.admin.allowed_ips', ''));

        if ($allowedEmails === [] && $allowedIps === []) {
            $this->addRow(
                'WARN',
                'Admin allowlist',
                'Both ADMIN_ALLOWED_EMAILS and ADMIN_ALLOWED_IPS are empty.'
            );

            return;
        }

        $this->addRow(
            'OK',
            'Admin allowlist',
            sprintf('Emails: %d, IP/CIDR rules: %d', count($allowedEmails), count($allowedIps))
        );
    }

    private function checkRateLimits(): void
    {
        $keys = [
            'auth_login_per_minute',
            'cart_write_per_minute',
            'checkout_confirm_per_minute',
            'admin_requests_per_minute',
            'admin_2fa_per_minute',
        ];

        foreach ($keys as $key) {
            $value = (int) config('security.rate_limits.'.$key, 0);
            if ($value <= 0) {
                $this->addRow('FAIL', 'Rate limit: '.$key, 'Value must be greater than 0.');

                continue;
            }

            $this->addRow('OK', 'Rate limit: '.$key, 'Configured with value '.$value.'.');
        }
    }

    private function checkTwoFactorSessionWindow(): void
    {
        $value = (int) config('security.admin.two_factor_session_minutes', 0);
        if ($value <= 0) {
            $this->addRow(
                'WARN',
                'ADMIN_2FA_SESSION_MINUTES',
                'Value is 0 (2FA challenge may not expire).'
            );

            return;
        }

        $this->addRow('OK', 'ADMIN_2FA_SESSION_MINUTES', 'Configured with value '.$value.'.');
    }

    private function checkMonitoring(bool $isProduction): void
    {
        $enabled = (bool) config('monitoring.enabled', true);
        if (! $enabled) {
            $this->addRow(
                $isProduction ? 'WARN' : 'WARN',
                'Monitoring',
                'Disabled. Enable MONITORING_ENABLED=true.'
            );

            return;
        }

        $this->addRow('OK', 'Monitoring', 'Enabled.');

        $dsn = trim((string) config('monitoring.sentry.dsn', ''));
        if ($dsn === '') {
            $this->addRow(
                $isProduction ? 'WARN' : 'WARN',
                'Sentry DSN',
                'Not configured. Set SENTRY_DSN for external error tracking.'
            );
        } else {
            $this->addRow('OK', 'Sentry DSN', 'Configured.');
        }

        $alertsEnabled = (bool) config('monitoring.alerts.enabled', true);
        if (! $alertsEnabled) {
            $this->addRow(
                $isProduction ? 'WARN' : 'WARN',
                'Ops alerts',
                'Disabled. Enable OPS_ALERTS_ENABLED=true.'
            );

            return;
        }

        $channel = trim((string) config('monitoring.alerts.channel', ''));
        if ($channel === '') {
            $this->addRow('FAIL', 'Ops alerts', 'Alert channel is empty (OPS_ALERTS_CHANNEL).');

            return;
        }

        $channelConfig = config('logging.channels.'.$channel);
        if (! is_array($channelConfig)) {
            $this->addRow('FAIL', 'Ops alerts', 'Channel `'.$channel.'` not found in logging config.');

            return;
        }

        $this->addRow('OK', 'Ops alerts', 'Enabled via channel `'.$channel.'`.');
    }

    private function checkWeeklyReportSetup(bool $isProduction): void
    {
        $emails = $this->parseCsv((string) config('ops.reports.dashboard_weekly_recipients', ''));

        if ($emails === []) {
            $this->addRow(
                $isProduction ? 'WARN' : 'WARN',
                'Weekly KPI report',
                'No recipients configured. Set OPS_WEEKLY_REPORT_EMAILS.'
            );

            return;
        }

        $day = strtolower(trim((string) config('ops.reports.dashboard_weekly_day', 'monday')));
        $time = trim((string) config('ops.reports.dashboard_weekly_time', '08:00'));
        $range = (int) config('ops.reports.dashboard_weekly_range_days', 30);

        $allowedDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        if (! in_array($day, $allowedDays, true)) {
            $this->addRow('WARN', 'Weekly KPI report', "Invalid day `{$day}`. Use sunday..saturday.");

            return;
        }

        if (! preg_match('/^\d{2}:\d{2}$/', $time)) {
            $this->addRow('WARN', 'Weekly KPI report', "Invalid time `{$time}`. Use HH:MM format.");

            return;
        }

        if (! in_array($range, [7, 30, 90], true)) {
            $this->addRow('WARN', 'Weekly KPI report', "Invalid range `{$range}`. Use 7, 30 or 90.");

            return;
        }

        $this->addRow(
            'OK',
            'Weekly KPI report',
            sprintf('Recipients: %d, schedule: %s %s, range: %d days.', count($emails), $day, $time, $range)
        );
    }

    private function checkDatabaseConnection(): bool
    {
        try {
            DB::select('SELECT 1');
            $this->addRow('OK', 'Database connection', 'Connected.');

            return true;
        } catch (Throwable $e) {
            $this->addRow('FAIL', 'Database connection', $this->sanitizeExceptionMessage($e->getMessage()));

            return false;
        }
    }

    private function checkCoreTables(): void
    {
        $requiredTables = [
            'users',
            'orders',
            'order_items',
            'repairs',
            'audit_logs',
            'order_whatsapp_logs',
            'repair_whatsapp_logs',
        ];

        $missing = [];
        foreach ($requiredTables as $table) {
            try {
                if (! Schema::hasTable($table)) {
                    $missing[] = $table;
                }
            } catch (Throwable $e) {
                $missing[] = $table.' ('.$this->sanitizeExceptionMessage($e->getMessage()).')';
            }
        }

        if ($missing !== []) {
            $this->addRow('FAIL', 'Core tables', 'Missing: '.implode(', ', $missing));

            return;
        }

        $this->addRow('OK', 'Core tables', 'All required tables are available.');
    }

    private function checkCacheStore(string $label, string $store): void
    {
        if ($store === '') {
            $this->addRow('FAIL', $label, 'No store configured.');

            return;
        }

        $key = 'ops_health:'.Str::random(16);

        try {
            Cache::store($store)->put($key, 'ok', now()->addSeconds(30));
            $value = Cache::store($store)->get($key);
            Cache::store($store)->forget($key);

            if ($value !== 'ok') {
                $this->addRow('FAIL', $label, 'Write/read validation failed for store `'.$store.'`.');

                return;
            }

            $this->addRow('OK', $label, 'Store `'.$store.'` is healthy.');
        } catch (Throwable $e) {
            $this->addRow('FAIL', $label, $this->sanitizeExceptionMessage($e->getMessage()));
        }
    }

    private function checkQueueDriver(bool $isProduction): void
    {
        $driver = (string) config('queue.default', 'sync');

        if ($driver === 'sync') {
            $this->addRow(
                $isProduction ? 'WARN' : 'WARN',
                'QUEUE_CONNECTION',
                'Using sync driver. Background jobs are not async.'
            );

            return;
        }

        if ($driver === 'database') {
            if (! Schema::hasTable((string) config('queue.connections.database.table', 'jobs'))) {
                $this->addRow('FAIL', 'QUEUE_CONNECTION', 'Database queue selected but jobs table is missing.');

                return;
            }
        }

        $this->addRow('OK', 'QUEUE_CONNECTION', 'Using `'.$driver.'`.');
    }

    private function checkWritablePath(string $label, string $path): void
    {
        if (! is_dir($path)) {
            $this->addRow('FAIL', $label, 'Directory does not exist: '.$path);

            return;
        }

        if (! is_writable($path)) {
            $this->addRow('FAIL', $label, 'Directory is not writable: '.$path);

            return;
        }

        $this->addRow('OK', $label, 'Writable.');
    }

    private function checkOptimizeCaches(bool $isProduction): void
    {
        $configCached = app()->configurationIsCached();
        $routesCached = app()->routesAreCached();

        if ($isProduction && ! $configCached) {
            $this->addRow('WARN', 'Config cache', 'Not cached. Run `php artisan config:cache`.');
        } else {
            $this->addRow('OK', 'Config cache', $configCached ? 'Cached.' : 'Not cached (acceptable in non-production).');
        }

        if ($isProduction && ! $routesCached) {
            $this->addRow('WARN', 'Route cache', 'Not cached. Run `php artisan route:cache`.');
        } else {
            $this->addRow('OK', 'Route cache', $routesCached ? 'Cached.' : 'Not cached (acceptable in non-production).');
        }
    }

    private function addRow(string $status, string $check, string $details): void
    {
        $this->rows[] = [
            'status' => $status,
            'check' => $check,
            'details' => $details,
        ];
    }

    private function renderReport(): void
    {
        $this->line('');
        $this->info('Health Check Report');

        $tableRows = array_map(function (array $row): array {
            return [$row['status'], $row['check'], $row['details']];
        }, $this->rows);

        $this->table(['Status', 'Check', 'Details'], $tableRows);

        $summary = $this->summarize();
        $this->line(sprintf(
            'Summary: %d OK, %d WARN, %d FAIL',
            $summary['ok'],
            $summary['warn'],
            $summary['fail']
        ));
    }

    /**
     * @return array{ok:int,warn:int,fail:int}
     */
    private function summarize(): array
    {
        $summary = ['ok' => 0, 'warn' => 0, 'fail' => 0];

        foreach ($this->rows as $row) {
            $status = Str::lower($row['status']);
            if (isset($summary[$status])) {
                $summary[$status]++;
            }
        }

        return $summary;
    }

    /**
     * @return array<int, string>
     */
    private function parseCsv(string $raw): array
    {
        $raw = trim($raw);
        if ($raw === '') {
            return [];
        }

        return array_values(array_filter(array_map(
            static fn (string $value): string => trim($value),
            explode(',', $raw)
        )));
    }

    private function sanitizeExceptionMessage(string $message): string
    {
        $trimmed = trim($message);
        if ($trimmed === '') {
            return 'Unexpected error.';
        }

        return Str::limit(str_replace(["\r", "\n"], ' ', $trimmed), 220);
    }
}
