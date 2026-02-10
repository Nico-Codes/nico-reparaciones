<?php

namespace Tests\Unit;

use App\Support\AdminCountersCache;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AdminCountersCacheTest extends TestCase
{
    public function test_orders_cache_uses_same_bucket_until_version_bump(): void
    {
        Cache::flush();
        $calls = 0;

        $first = AdminCountersCache::rememberOrders('status_counts', ['q' => '', 'wa' => ''], function () use (&$calls): array {
            $calls++;
            return ['calls' => $calls];
        });

        $second = AdminCountersCache::rememberOrders('status_counts', ['q' => '', 'wa' => ''], function () use (&$calls): array {
            $calls++;
            return ['calls' => $calls];
        });

        $this->assertSame(['calls' => 1], $first);
        $this->assertSame(['calls' => 1], $second);
        $this->assertSame(1, $calls);

        AdminCountersCache::bumpOrders();

        $third = AdminCountersCache::rememberOrders('status_counts', ['q' => '', 'wa' => ''], function () use (&$calls): array {
            $calls++;
            return ['calls' => $calls];
        });

        $this->assertSame(['calls' => 2], $third);
        $this->assertSame(2, $calls);
    }

    public function test_repairs_cache_uses_same_bucket_until_version_bump(): void
    {
        Cache::flush();
        $calls = 0;

        $first = AdminCountersCache::rememberRepairs('status_counts', ['q' => '', 'wa' => 'pending'], function () use (&$calls): array {
            $calls++;
            return ['calls' => $calls];
        });

        $second = AdminCountersCache::rememberRepairs('status_counts', ['q' => '', 'wa' => 'pending'], function () use (&$calls): array {
            $calls++;
            return ['calls' => $calls];
        });

        $this->assertSame(['calls' => 1], $first);
        $this->assertSame(['calls' => 1], $second);
        $this->assertSame(1, $calls);

        AdminCountersCache::bumpRepairs();

        $third = AdminCountersCache::rememberRepairs('status_counts', ['q' => '', 'wa' => 'pending'], function () use (&$calls): array {
            $calls++;
            return ['calls' => $calls];
        });

        $this->assertSame(['calls' => 2], $third);
        $this->assertSame(2, $calls);
    }
}
