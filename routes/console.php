<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('ops:health-check --strict')
    ->dailyAt((string) config('ops.schedules.health_check_time', '03:00'))
    ->withoutOverlapping();

Schedule::command('ops:backup --only=all')
    ->dailyAt((string) config('ops.schedules.backup_time', '03:15'))
    ->withoutOverlapping();

$weeklyDayMap = [
    'sunday' => 0,
    'monday' => 1,
    'tuesday' => 2,
    'wednesday' => 3,
    'thursday' => 4,
    'friday' => 5,
    'saturday' => 6,
];

$weeklyDayRaw = strtolower((string) config('ops.reports.dashboard_weekly_day', 'monday'));
$weeklyDay = $weeklyDayMap[$weeklyDayRaw] ?? 1;
$weeklyTime = (string) config('ops.reports.dashboard_weekly_time', '08:00');

Schedule::command('ops:dashboard-report-email')
    ->weeklyOn($weeklyDay, $weeklyTime)
    ->withoutOverlapping();
