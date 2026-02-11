<?php

namespace Tests\Feature;

use Illuminate\Filesystem\Filesystem;
use Tests\TestCase;

class OpsAlertTestCommandTest extends TestCase
{
    private Filesystem $files;

    protected function setUp(): void
    {
        parent::setUp();
        $this->files = new Filesystem;
    }

    public function test_ops_alert_test_command_writes_to_configured_channel(): void
    {
        $logPath = storage_path('logs/test-ops-alert-command.log');
        if ($this->files->exists($logPath)) {
            $this->files->delete($logPath);
        }

        config()->set('monitoring.alerts.channel', 'test_ops_alert_command');
        config()->set('logging.channels.test_ops_alert_command', [
            'driver' => 'single',
            'path' => $logPath,
            'level' => 'critical',
            'replace_placeholders' => true,
        ]);

        $this->artisan('ops:alert-test --message="Monitor command test"')
            ->assertExitCode(0);

        $this->assertFileExists($logPath);
        $content = (string) file_get_contents($logPath);
        $this->assertStringContainsString('Monitor command test', $content);
    }
}
