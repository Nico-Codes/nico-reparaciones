<?php

return [
    'schedules' => [
        'health_check_time' => env('OPS_HEALTH_CHECK_TIME', '03:00'),
        'backup_time' => env('OPS_BACKUP_TIME', '03:15'),
    ],

    'backups' => [
        'path' => env('OPS_BACKUP_PATH', 'app/backups'),
        'files_source' => env('OPS_BACKUP_FILES_SOURCE', 'app/public'),
        'retention_days' => (int) env('OPS_BACKUP_RETENTION_DAYS', 14),
        'mysql_dump_binary' => env('MYSQLDUMP_BINARY', ''),
        'command_timeout_seconds' => (int) env('OPS_BACKUP_COMMAND_TIMEOUT', 180),
    ],
];
