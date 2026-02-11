<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Str;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;
use Symfony\Component\Process\Process;
use Throwable;

class OpsBackupCommand extends Command
{
    protected $signature = 'ops:backup
        {--only=all : Backup scope: all, db, files}
        {--retention-days= : Override retention days}
        {--prune-only : Only delete old backups}';

    protected $description = 'Create snapshot backups for database and uploaded files.';

    private Filesystem $files;

    public function __construct(Filesystem $files)
    {
        parent::__construct();
        $this->files = $files;
    }

    public function handle(): int
    {
        $scope = Str::lower((string) $this->option('only'));
        if (! in_array($scope, ['all', 'db', 'files'], true)) {
            $this->error('Invalid value for --only. Allowed: all, db, files.');

            return self::FAILURE;
        }

        $retentionDays = $this->resolveRetentionDays();
        if ($retentionDays < 0) {
            $this->error('Invalid retention value. Use 0 or greater.');

            return self::FAILURE;
        }

        try {
            $backupRoot = $this->backupRootPath();
            $this->files->ensureDirectoryExists($backupRoot);
        } catch (Throwable $e) {
            $this->error('Backup setup failed: '.$this->sanitizeError($e->getMessage()));

            return self::FAILURE;
        }

        if ((bool) $this->option('prune-only')) {
            $deleted = $this->pruneBackups($backupRoot, $retentionDays);
            $this->info("Prune completed. Deleted snapshots: {$deleted}.");

            return self::SUCCESS;
        }

        $snapshotName = 'backup_'.now()->format('Ymd_His');
        $snapshotPath = $backupRoot.DIRECTORY_SEPARATOR.$snapshotName;
        $this->files->ensureDirectoryExists($snapshotPath);

        $manifest = [
            'created_at' => now()->toIso8601String(),
            'scope' => $scope,
            'retention_days' => $retentionDays,
            'database_connection' => (string) config('database.default', ''),
            'artifacts' => [],
        ];

        try {
            if (in_array($scope, ['all', 'db'], true)) {
                $manifest['artifacts'][] = $this->backupDatabase($snapshotPath);
            }

            if (in_array($scope, ['all', 'files'], true)) {
                $manifest['artifacts'][] = $this->backupUploadedFiles($snapshotPath);
            }

            $manifestPath = $snapshotPath.DIRECTORY_SEPARATOR.'manifest.json';
            $this->files->put(
                $manifestPath,
                json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR)
            );
        } catch (Throwable $e) {
            $this->files->put($snapshotPath.DIRECTORY_SEPARATOR.'backup-error.log', $e->getMessage().PHP_EOL);
            $this->error('Backup failed: '.$this->sanitizeError($e->getMessage()));

            return self::FAILURE;
        }

        $deleted = $this->pruneBackups($backupRoot, $retentionDays);
        $relativeSnapshotPath = $this->toRelativeStoragePath($snapshotPath);

        $this->info("Backup completed: {$relativeSnapshotPath}");
        if ($deleted > 0) {
            $this->info("Old snapshots deleted by retention policy: {$deleted}");
        }

        return self::SUCCESS;
    }

    /**
     * @return array{type:string,driver:string,path:string,size_bytes:int}
     */
    private function backupDatabase(string $snapshotPath): array
    {
        $connectionName = (string) config('database.default', '');

        if ($connectionName === 'sqlite') {
            return $this->backupSqliteDatabase($snapshotPath);
        }

        if (in_array($connectionName, ['mysql', 'mariadb'], true)) {
            return $this->backupMysqlDatabase($snapshotPath, $connectionName);
        }

        throw new RuntimeException('Unsupported database driver for backup: '.$connectionName);
    }

    /**
     * @return array{type:string,driver:string,path:string,size_bytes:int}
     */
    private function backupSqliteDatabase(string $snapshotPath): array
    {
        $databasePath = (string) config('database.connections.sqlite.database', '');
        if ($databasePath === '' || $databasePath === ':memory:') {
            throw new RuntimeException('SQLite backup requires a file-based database path.');
        }

        if (! $this->files->exists($databasePath)) {
            throw new RuntimeException('SQLite database file does not exist: '.$databasePath);
        }

        $destination = $snapshotPath.DIRECTORY_SEPARATOR.'database.sqlite';
        if (! $this->files->copy($databasePath, $destination)) {
            throw new RuntimeException('Could not copy SQLite database file.');
        }

        return [
            'type' => 'database',
            'driver' => 'sqlite',
            'path' => $this->toRelativeStoragePath($destination),
            'size_bytes' => (int) ($this->files->size($destination) ?: 0),
        ];
    }

    /**
     * @return array{type:string,driver:string,path:string,size_bytes:int}
     */
    private function backupMysqlDatabase(string $snapshotPath, string $connectionName): array
    {
        $connection = (array) config('database.connections.'.$connectionName, []);
        $database = (string) ($connection['database'] ?? '');
        $username = (string) ($connection['username'] ?? '');
        $password = (string) ($connection['password'] ?? '');
        $host = $connection['host'] ?? '127.0.0.1';
        $host = is_array($host) ? (string) ($host[0] ?? '127.0.0.1') : (string) $host;
        $port = (string) ($connection['port'] ?? '3306');

        if ($database === '' || $username === '') {
            throw new RuntimeException('MySQL backup requires database and username configuration.');
        }

        $mysqldump = $this->resolveMysqlDumpBinary();
        $command = [
            $mysqldump,
            '--host='.$host,
            '--port='.$port,
            '--user='.$username,
            '--single-transaction',
            '--skip-lock-tables',
            '--routines',
            '--events',
            '--default-character-set=utf8mb4',
            $database,
        ];

        $process = new Process($command, base_path(), ['MYSQL_PWD' => $password]);
        $process->setTimeout((int) config('ops.backups.command_timeout_seconds', 180));
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException('mysqldump failed: '.trim($process->getErrorOutput() ?: $process->getOutput()));
        }

        $destination = $snapshotPath.DIRECTORY_SEPARATOR.'database.sql';
        $output = $process->getOutput();
        if ($output === '') {
            $output = '-- Empty dump output generated at '.now()->toDateTimeString().PHP_EOL;
        }

        $this->files->put($destination, $output);

        return [
            'type' => 'database',
            'driver' => $connectionName,
            'path' => $this->toRelativeStoragePath($destination),
            'size_bytes' => (int) ($this->files->size($destination) ?: 0),
        ];
    }

    private function resolveMysqlDumpBinary(): string
    {
        $configured = trim((string) config('ops.backups.mysql_dump_binary', ''));
        $candidates = array_values(array_filter([
            $configured,
            'mysqldump',
            'mariadb-dump',
        ]));

        foreach ($candidates as $candidate) {
            try {
                $probe = new Process([$candidate, '--version'], base_path());
                $probe->setTimeout(5);
                $probe->run();
                if ($probe->isSuccessful()) {
                    return $candidate;
                }
            } catch (Throwable) {
                // Try next candidate.
            }
        }

        throw new RuntimeException(
            'mysqldump binary not found. Set MYSQLDUMP_BINARY in .env with a valid executable path.'
        );
    }

    /**
     * @return array{type:string,path:string,files_copied:int}
     */
    private function backupUploadedFiles(string $snapshotPath): array
    {
        $sourceRelative = trim((string) config('ops.backups.files_source', 'app/public'), '/\\');
        $sourcePath = storage_path($sourceRelative);
        $destinationPath = $snapshotPath.DIRECTORY_SEPARATOR.'files';
        $this->files->ensureDirectoryExists($destinationPath);

        $filesCopied = 0;
        if ($this->files->isDirectory($sourcePath)) {
            $filesCopied = $this->copyDirectoryContents($sourcePath, $destinationPath);
        }

        return [
            'type' => 'files',
            'path' => $this->toRelativeStoragePath($destinationPath),
            'files_copied' => $filesCopied,
        ];
    }

    private function copyDirectoryContents(string $sourcePath, string $destinationPath): int
    {
        $filesCopied = 0;

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($sourcePath, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $item) {
            $relative = $iterator->getSubPathName();
            $target = $destinationPath.DIRECTORY_SEPARATOR.$relative;

            if ($item->isDir()) {
                $this->files->ensureDirectoryExists($target);

                continue;
            }

            $this->files->ensureDirectoryExists(dirname($target));
            if (! $this->files->copy($item->getPathname(), $target)) {
                throw new RuntimeException('Could not copy file: '.$item->getPathname());
            }

            $filesCopied++;
        }

        return $filesCopied;
    }

    private function pruneBackups(string $backupRoot, int $retentionDays): int
    {
        if ($retentionDays <= 0 || ! $this->files->isDirectory($backupRoot)) {
            return 0;
        }

        $cutoff = now()->subDays($retentionDays)->getTimestamp();
        $deleted = 0;

        foreach ($this->files->directories($backupRoot) as $directory) {
            $basename = basename($directory);
            if (! Str::startsWith($basename, 'backup_')) {
                continue;
            }

            $snapshotTimestamp = $this->resolveSnapshotTimestamp($basename, $directory);
            if ($snapshotTimestamp < $cutoff && $this->files->deleteDirectory($directory)) {
                $deleted++;
            }
        }

        return $deleted;
    }

    private function resolveSnapshotTimestamp(string $basename, string $directory): int
    {
        if (preg_match('/^backup_(\d{8})_(\d{6})$/', $basename, $matches) === 1) {
            $parsed = \DateTimeImmutable::createFromFormat('YmdHis', $matches[1].$matches[2]);
            if ($parsed !== false) {
                return $parsed->getTimestamp();
            }
        }

        return $this->files->lastModified($directory);
    }

    private function resolveRetentionDays(): int
    {
        $option = $this->option('retention-days');
        if ($option === null || $option === '') {
            return (int) config('ops.backups.retention_days', 14);
        }

        return (int) $option;
    }

    private function backupRootPath(): string
    {
        $relative = trim((string) config('ops.backups.path', 'app/backups'), '/\\');
        if ($relative === '') {
            throw new RuntimeException('Backup path configuration cannot be empty.');
        }

        return storage_path($relative);
    }

    private function toRelativeStoragePath(string $absolutePath): string
    {
        $prefix = rtrim(storage_path(), '/\\').DIRECTORY_SEPARATOR;

        return Str::replaceFirst($prefix, 'storage'.DIRECTORY_SEPARATOR, $absolutePath);
    }

    private function sanitizeError(string $message): string
    {
        return Str::of($message)->replace(["\r", "\n"], ' ')->trim()->value();
    }
}
