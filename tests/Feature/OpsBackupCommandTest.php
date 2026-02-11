<?php

namespace Tests\Feature;

use Illuminate\Filesystem\Filesystem;
use Tests\TestCase;

class OpsBackupCommandTest extends TestCase
{
    private Filesystem $files;

    protected function setUp(): void
    {
        parent::setUp();
        $this->files = new Filesystem;
    }

    public function test_backup_command_creates_snapshot_for_sqlite_and_files(): void
    {
        $backupRelative = 'framework/testing/backups';
        $backupRoot = storage_path($backupRelative);
        $sourceRelative = 'framework/testing/backup-source';
        $sourceRoot = storage_path($sourceRelative);
        $sqlitePath = storage_path('framework/testing/backup.sqlite');

        $this->files->deleteDirectory($backupRoot);
        $this->files->deleteDirectory($sourceRoot);
        if ($this->files->exists($sqlitePath)) {
            $this->files->delete($sqlitePath);
        }

        $this->files->ensureDirectoryExists(dirname($sqlitePath));
        $this->files->put($sqlitePath, 'sqlite-backup-test');
        $this->files->ensureDirectoryExists($sourceRoot);
        $this->files->put($sourceRoot.DIRECTORY_SEPARATOR.'logo.txt', 'asset-backup-test');

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', $sqlitePath);
        config()->set('ops.backups.path', $backupRelative);
        config()->set('ops.backups.files_source', $sourceRelative);
        config()->set('ops.backups.retention_days', 14);

        $this->artisan('ops:backup --only=all')
            ->assertExitCode(0);

        $snapshots = glob($backupRoot.DIRECTORY_SEPARATOR.'backup_*');
        $this->assertNotFalse($snapshots);
        $this->assertNotEmpty($snapshots);
        sort($snapshots);
        $latest = end($snapshots);
        $this->assertIsString($latest);
        $this->assertNotSame('', $latest);

        $this->assertFileExists($latest.DIRECTORY_SEPARATOR.'database.sqlite');
        $this->assertFileExists($latest.DIRECTORY_SEPARATOR.'files'.DIRECTORY_SEPARATOR.'logo.txt');
        $this->assertFileExists($latest.DIRECTORY_SEPARATOR.'manifest.json');

        $manifestRaw = file_get_contents($latest.DIRECTORY_SEPARATOR.'manifest.json');
        $this->assertNotFalse($manifestRaw);
        $manifest = json_decode($manifestRaw, true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame('all', $manifest['scope'] ?? null);
        $this->assertSame('sqlite', $manifest['database_connection'] ?? null);

        $this->files->deleteDirectory($backupRoot);
        $this->files->deleteDirectory($sourceRoot);
        $this->files->delete($sqlitePath);
    }

    public function test_backup_command_prunes_old_snapshots_when_requested(): void
    {
        $backupRelative = 'framework/testing/backups';
        $backupRoot = storage_path($backupRelative);
        $oldSnapshot = $backupRoot.DIRECTORY_SEPARATOR.'backup_20000101_000000';

        $this->files->deleteDirectory($backupRoot);
        $this->files->ensureDirectoryExists($oldSnapshot);
        $this->files->put($oldSnapshot.DIRECTORY_SEPARATOR.'manifest.json', '{}');

        config()->set('ops.backups.path', $backupRelative);
        config()->set('ops.backups.retention_days', 7);

        $this->artisan('ops:backup --prune-only')
            ->assertExitCode(0);

        $this->assertDirectoryDoesNotExist($oldSnapshot);
        $this->files->deleteDirectory($backupRoot);
    }
}
