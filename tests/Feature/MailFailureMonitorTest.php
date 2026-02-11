<?php

namespace Tests\Feature;

use App\Support\MailFailureMonitor;
use Illuminate\Contracts\Queue\Job;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Queue\Events\JobFailed;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class MailFailureMonitorTest extends TestCase
{
    use RefreshDatabase;

    private Filesystem $files;

    protected function setUp(): void
    {
        parent::setUp();
        $this->files = new Filesystem;
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_queue_mail_failure_emits_ops_alert_log(): void
    {
        $logPath = storage_path('logs/test-mail-failure-monitor.log');
        if ($this->files->exists($logPath)) {
            $this->files->delete($logPath);
        }

        config()->set('ops.mail.alerts_on_failure', true);
        config()->set('monitoring.alerts.enabled', true);
        config()->set('monitoring.alerts.channel', 'test_mail_alerts');
        config()->set('monitoring.alerts.dedupe_minutes', 0);
        config()->set('logging.channels.test_mail_alerts', [
            'driver' => 'single',
            'path' => $logPath,
            'level' => 'critical',
            'replace_placeholders' => true,
        ]);

        $job = Mockery::mock(Job::class);
        $job->shouldReceive('resolveName')->andReturn('Illuminate\\Mail\\SendQueuedMailable');
        $job->shouldReceive('payload')->andReturn([
            'data' => [
                'commandName' => 'Illuminate\\Mail\\SendQueuedMailable',
            ],
        ]);
        $job->shouldReceive('getQueue')->andReturn('mail');
        $job->shouldReceive('getJobId')->andReturn('job-123');

        app(MailFailureMonitor::class)->reportQueueFailure(new JobFailed(
            'database',
            $job,
            new RuntimeException('SMTP provider unavailable')
        ));

        $this->assertFileExists($logPath);
        $content = (string) file_get_contents($logPath);
        $this->assertStringContainsString('Mail delivery failed.', $content);
        $this->assertStringContainsString('queue_failed', $content);
        $this->assertStringContainsString('SendQueuedMailable', $content);
    }

    public function test_non_mail_queue_failure_is_ignored_by_mail_failure_monitor(): void
    {
        $logPath = storage_path('logs/test-mail-failure-monitor-ignore.log');
        if ($this->files->exists($logPath)) {
            $this->files->delete($logPath);
        }

        config()->set('ops.mail.alerts_on_failure', true);
        config()->set('monitoring.alerts.enabled', true);
        config()->set('monitoring.alerts.channel', 'test_mail_alerts_ignore');
        config()->set('monitoring.alerts.dedupe_minutes', 0);
        config()->set('logging.channels.test_mail_alerts_ignore', [
            'driver' => 'single',
            'path' => $logPath,
            'level' => 'critical',
            'replace_placeholders' => true,
        ]);

        $job = Mockery::mock(Job::class);
        $job->shouldReceive('resolveName')->andReturn('App\\Jobs\\ReindexProductsJob');
        $job->shouldReceive('payload')->andReturn(['data' => ['commandName' => 'App\\Jobs\\ReindexProductsJob']]);

        app(MailFailureMonitor::class)->reportQueueFailure(new JobFailed(
            'database',
            $job,
            new RuntimeException('General queue failure')
        ));

        $this->assertFalse($this->files->exists($logPath));
    }
}
