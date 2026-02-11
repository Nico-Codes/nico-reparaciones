<?php

namespace App\Support;

use App\Models\BusinessSetting;
use Throwable;

class OpsDashboardReportSettings
{
    public const KEY_RECIPIENTS = 'ops_weekly_report_emails';
    public const KEY_DAY = 'ops_weekly_report_day';
    public const KEY_TIME = 'ops_weekly_report_time';
    public const KEY_RANGE_DAYS = 'ops_weekly_report_range_days';

    private const ALLOWED_DAYS = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
    ];

    private const ALLOWED_RANGE_DAYS = [7, 30, 90];

    public static function recipientsRaw(): string
    {
        return trim(self::settingOrConfigString(
            self::KEY_RECIPIENTS,
            'ops.reports.dashboard_weekly_recipients',
            ''
        ));
    }

    public static function day(): string
    {
        $day = strtolower(trim(self::settingOrConfigString(
            self::KEY_DAY,
            'ops.reports.dashboard_weekly_day',
            'monday'
        )));

        if (! in_array($day, self::ALLOWED_DAYS, true)) {
            return 'monday';
        }

        return $day;
    }

    public static function time(): string
    {
        $time = trim(self::settingOrConfigString(
            self::KEY_TIME,
            'ops.reports.dashboard_weekly_time',
            '08:00'
        ));

        if (! preg_match('/^\d{2}:\d{2}$/', $time)) {
            return '08:00';
        }

        [$hours, $minutes] = array_map('intval', explode(':', $time));
        if ($hours < 0 || $hours > 23 || $minutes < 0 || $minutes > 59) {
            return '08:00';
        }

        return sprintf('%02d:%02d', $hours, $minutes);
    }

    public static function rangeDays(): int
    {
        $range = self::settingOrConfigInt(
            self::KEY_RANGE_DAYS,
            'ops.reports.dashboard_weekly_range_days',
            30
        );

        if (! in_array($range, self::ALLOWED_RANGE_DAYS, true)) {
            return 30;
        }

        return $range;
    }

    /**
     * @return array<int, string>
     */
    public static function allowedDays(): array
    {
        return self::ALLOWED_DAYS;
    }

    /**
     * @return array<int, int>
     */
    public static function allowedRangeDays(): array
    {
        return self::ALLOWED_RANGE_DAYS;
    }

    private static function settingOrConfigString(string $settingKey, string $configKey, string $default): string
    {
        $settingValue = self::readSetting($settingKey);
        if ($settingValue !== null && trim($settingValue) !== '') {
            return $settingValue;
        }

        $configValue = (string) config($configKey, $default);
        if (trim($configValue) !== '') {
            return $configValue;
        }

        return $default;
    }

    private static function settingOrConfigInt(string $settingKey, string $configKey, int $default): int
    {
        $settingValue = self::readSetting($settingKey);
        if ($settingValue !== null && trim($settingValue) !== '') {
            return (int) $settingValue;
        }

        return (int) config($configKey, $default);
    }

    private static function readSetting(string $settingKey): ?string
    {
        try {
            return BusinessSetting::getValue($settingKey, '');
        } catch (Throwable) {
            return null;
        }
    }
}
