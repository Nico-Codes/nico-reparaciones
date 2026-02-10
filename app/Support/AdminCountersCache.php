<?php

namespace App\Support;

use Closure;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Facades\Cache;
use Throwable;

class AdminCountersCache
{
    private const DEFAULT_TTL_SECONDS = 45;
    private const ORDERS_VERSION_KEY = 'admin:counters:orders:version';
    private const REPAIRS_VERSION_KEY = 'admin:counters:repairs:version';
    private static bool $warnedInvalidStore = false;

    public static function rememberOrders(string $bucket, array $filters, Closure $resolver, int $ttlSeconds = self::DEFAULT_TTL_SECONDS): mixed
    {
        return self::remember('orders', self::ORDERS_VERSION_KEY, $bucket, $filters, $resolver, $ttlSeconds);
    }

    public static function rememberRepairs(string $bucket, array $filters, Closure $resolver, int $ttlSeconds = self::DEFAULT_TTL_SECONDS): mixed
    {
        return self::remember('repairs', self::REPAIRS_VERSION_KEY, $bucket, $filters, $resolver, $ttlSeconds);
    }

    public static function bumpOrders(): void
    {
        self::bumpVersion(self::ORDERS_VERSION_KEY);
    }

    public static function bumpRepairs(): void
    {
        self::bumpVersion(self::REPAIRS_VERSION_KEY);
    }

    private static function remember(
        string $domain,
        string $versionKey,
        string $bucket,
        array $filters,
        Closure $resolver,
        int $ttlSeconds
    ): mixed {
        $version = self::currentVersion($versionKey);
        $hash = sha1(json_encode($filters, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}');
        $cacheKey = "admin:counters:{$domain}:{$bucket}:v{$version}:{$hash}";

        return self::store()->remember($cacheKey, now()->addSeconds($ttlSeconds), $resolver);
    }

    private static function currentVersion(string $versionKey): int
    {
        $version = self::store()->get($versionKey);
        if (is_numeric($version) && (int) $version > 0) {
            return (int) $version;
        }

        self::store()->forever($versionKey, 1);
        return 1;
    }

    private static function bumpVersion(string $versionKey): void
    {
        self::currentVersion($versionKey);

        $nextVersion = self::store()->increment($versionKey);
        if (!is_int($nextVersion) || $nextVersion < 1) {
            self::store()->forever($versionKey, ((int) self::store()->get($versionKey, 1)) + 1);
        }
    }

    private static function store(): Repository
    {
        $storeName = (string) config('cache.admin_counters_store', config('cache.default'));
        if ($storeName === '') {
            return Cache::store();
        }

        try {
            return Cache::store($storeName);
        } catch (Throwable) {
            if (!self::$warnedInvalidStore) {
                self::$warnedInvalidStore = true;
                logger()->warning('Admin counters cache store is invalid, falling back to default.', [
                    'store' => $storeName,
                ]);
            }

            return Cache::store();
        }
    }
}
