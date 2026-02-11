<?php

namespace Tests\Feature;

use App\Support\ExceptionMonitor;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Http\Request;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Tests\TestCase;
use Throwable;

class ExceptionMonitorTest extends TestCase
{
    private Filesystem $files;

    protected function setUp(): void
    {
        parent::setUp();
        $this->files = new Filesystem;
    }

    public function test_exception_monitor_writes_critical_alert_with_deduplication(): void
    {
        $logPath = storage_path('logs/test-monitor-alerts.log');
        if ($this->files->exists($logPath)) {
            $this->files->delete($logPath);
        }

        config()->set('monitoring.enabled', true);
        config()->set('monitoring.alerts.enabled', true);
        config()->set('monitoring.alerts.channel', 'test_ops_alerts');
        config()->set('monitoring.alerts.dedupe_minutes', 10);
        config()->set('monitoring.sentry.dsn', '');
        config()->set('logging.channels.test_ops_alerts', [
            'driver' => 'single',
            'path' => $logPath,
            'level' => 'critical',
            'replace_placeholders' => true,
        ]);

        $request = Request::create('/test-monitoring', 'GET');
        $monitor = app(ExceptionMonitor::class);
        $exception = new RuntimeException('E2E monitor failure');
        $monitor->report($exception, $request);
        $monitor->report($exception, $request);

        $this->assertFileExists($logPath);
        $content = (string) file_get_contents($logPath);
        $this->assertStringContainsString('Unhandled exception: RuntimeException', $content);
        $this->assertSame(1, substr_count($content, 'Unhandled exception: RuntimeException'));
    }

    public function test_exception_monitor_ignores_404_by_default(): void
    {
        $logPath = storage_path('logs/test-monitor-ignored.log');
        if ($this->files->exists($logPath)) {
            $this->files->delete($logPath);
        }

        config()->set('monitoring.enabled', true);
        config()->set('monitoring.alerts.enabled', true);
        config()->set('monitoring.alerts.channel', 'test_ops_alerts_ignore');
        config()->set('monitoring.sentry.dsn', '');
        config()->set('logging.channels.test_ops_alerts_ignore', [
            'driver' => 'single',
            'path' => $logPath,
            'level' => 'critical',
            'replace_placeholders' => true,
        ]);

        app(ExceptionMonitor::class)->report(new NotFoundHttpException('not found'));

        if ($this->files->exists($logPath)) {
            $content = (string) file_get_contents($logPath);
            $this->assertStringNotContainsString('Unhandled exception', $content);

            return;
        }

        $this->assertFalse($this->files->exists($logPath));
    }

    public function test_exception_monitor_calls_sentry_hub_when_available(): void
    {
        $fakeHub = new class
        {
            public int $calls = 0;

            public ?Throwable $last = null;

            public function captureException(Throwable $throwable): void
            {
                $this->calls++;
                $this->last = $throwable;
            }
        };

        $this->app->instance('sentry', $fakeHub);

        config()->set('monitoring.enabled', true);
        config()->set('monitoring.alerts.enabled', false);
        config()->set('monitoring.sentry.dsn', 'https://public@example.ingest.sentry.io/1');

        $exception = new RuntimeException('sentry capture test');
        app(ExceptionMonitor::class)->report($exception);

        $this->assertSame(1, $fakeHub->calls);
        $this->assertSame($exception, $fakeHub->last);
    }
}
