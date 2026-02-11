<?php

namespace App\Console\Commands;

use App\Mail\AdminDashboardWeeklyReportMail;
use App\Support\AdminDashboardReportBuilder;
use App\Support\OpsDashboardReportSettings;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

class OpsDashboardReportEmailCommand extends Command
{
    protected $signature = 'ops:dashboard-report-email
        {--range= : Days range (7, 30, 90)}
        {--to= : Comma-separated recipient emails}
        {--dry-run : Build report without sending email}';

    protected $description = 'Send weekly dashboard KPI report by email (with CSV attachment).';

    public function handle(AdminDashboardReportBuilder $reportBuilder): int
    {
        $configuredRange = OpsDashboardReportSettings::rangeDays();
        $range = $this->resolveRangeDays((string) ($this->option('range') ?? ''), $configuredRange);

        $report = $reportBuilder->build($range);
        $rangeDays = (int) $report['rangeDays'];
        $recipients = $this->resolveRecipients((string) ($this->option('to') ?? ''));

        if ($recipients === []) {
            $this->error('No recipients configured. Set OPS_WEEKLY_REPORT_EMAILS or use --to=');

            return self::FAILURE;
        }

        $csvContent = $this->buildCsv($report['rows']);
        $csvFilename = 'dashboard_kpis_'.$rangeDays.'d_'.now()->format('Ymd_His').'.csv';

        if ((bool) $this->option('dry-run')) {
            $this->line('Dry-run report built.');
            $this->line('Range: '.$rangeDays.' days.');
            $this->line('Recipients: '.implode(', ', $recipients));

            return self::SUCCESS;
        }

        try {
            Mail::to($recipients)->send(new AdminDashboardWeeklyReportMail(
                $rangeDays,
                $report['fromRange'],
                $report['toRange'],
                $report['kpis'],
                $csvFilename,
                $csvContent
            ));
        } catch (Throwable $e) {
            $this->error('Could not send dashboard report: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info('Dashboard report sent to: '.implode(', ', $recipients));

        return self::SUCCESS;
    }

    private function resolveRangeDays(string $rawOption, int $fallback): int
    {
        $candidate = trim($rawOption) !== '' ? (int) $rawOption : $fallback;

        return in_array($candidate, [7, 30, 90], true) ? $candidate : 30;
    }

    /**
     * @return array<int, string>
     */
    private function resolveRecipients(string $rawOption): array
    {
        $source = trim($rawOption);
        if ($source === '') {
            $source = OpsDashboardReportSettings::recipientsRaw();
        }

        if (trim($source) === '') {
            return [];
        }

        $emails = array_values(array_filter(array_map(
            static fn (string $value): string => trim($value),
            explode(',', $source)
        )));

        return array_values(array_filter($emails, static fn (string $email): bool => filter_var($email, FILTER_VALIDATE_EMAIL) !== false));
    }

    /**
     * @param  array<int, array<int, string>>  $rows
     */
    private function buildCsv(array $rows): string
    {
        $stream = fopen('php://temp', 'w+');
        if ($stream === false) {
            return '';
        }

        fwrite($stream, "\xEF\xBB\xBF");
        fputcsv($stream, ['seccion', 'metrica', 'valor', 'unidad', 'detalle']);
        foreach ($rows as $row) {
            fputcsv($stream, $row);
        }

        rewind($stream);
        $contents = stream_get_contents($stream);
        fclose($stream);

        return $contents !== false ? $contents : '';
    }
}
