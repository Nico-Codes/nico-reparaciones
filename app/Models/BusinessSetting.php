<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class BusinessSetting extends Model
{
    private const SETTINGS_CACHE_KEY = 'business_settings:map:v1';

    protected $fillable = [
        'key',
        'value',
        'updated_by',
    ];

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    protected static function booted(): void
    {
        static::saved(static function (): void {
            static::clearCache();
        });

        static::deleted(static function (): void {
            static::clearCache();
        });
    }

    public static function allValues(): Collection
    {
        return Cache::rememberForever(self::SETTINGS_CACHE_KEY, static function (): Collection {
            return static::query()->pluck('value', 'key');
        });
    }

    public static function getValue(string $key, string $default = ''): string
    {
        $settings = static::allValues();
        if (!$settings->has($key)) {
            return $default;
        }

        $val = $settings->get($key);
        return $val !== null ? (string) $val : $default;
    }

    public static function clearCache(): void
    {
        Cache::forget(self::SETTINGS_CACHE_KEY);
    }
}
