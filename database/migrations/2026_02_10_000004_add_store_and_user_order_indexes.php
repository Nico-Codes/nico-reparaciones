<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!$this->indexExists('categories', 'categories_active_name_idx')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->index(['active', 'name'], 'categories_active_name_idx');
            });
        }

        if (!$this->indexExists('products', 'products_active_category_featured_id_idx')) {
            Schema::table('products', function (Blueprint $table) {
                $table->index(['active', 'category_id', 'featured', 'id'], 'products_active_category_featured_id_idx');
            });
        }

        if (!$this->indexExists('products', 'products_active_category_price_id_idx')) {
            Schema::table('products', function (Blueprint $table) {
                $table->index(['active', 'category_id', 'price', 'id'], 'products_active_category_price_id_idx');
            });
        }

        if (!$this->indexExists('products', 'products_active_category_name_id_idx')) {
            Schema::table('products', function (Blueprint $table) {
                $table->index(['active', 'category_id', 'name', 'id'], 'products_active_category_name_id_idx');
            });
        }

        if (!$this->indexExists('products', 'products_active_slug_idx')) {
            Schema::table('products', function (Blueprint $table) {
                $table->index(['active', 'slug'], 'products_active_slug_idx');
            });
        }

        if (!$this->indexExists('orders', 'orders_user_status_created_at_idx')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->index(['user_id', 'status', 'created_at'], 'orders_user_status_created_at_idx');
            });
        }
    }

    public function down(): void
    {
        $this->dropIndexIfExists('categories', 'categories_active_name_idx');
        $this->dropIndexIfExists('products', 'products_active_category_featured_id_idx');
        $this->dropIndexIfExists('products', 'products_active_category_price_id_idx');
        $this->dropIndexIfExists('products', 'products_active_category_name_id_idx');
        $this->dropIndexIfExists('products', 'products_active_slug_idx');
        $this->dropIndexIfExists('orders', 'orders_user_status_created_at_idx');
    }

    private function dropIndexIfExists(string $table, string $indexName): void
    {
        if (!$this->indexExists($table, $indexName)) {
            return;
        }

        Schema::table($table, function (Blueprint $table) use ($indexName) {
            $table->dropIndex($indexName);
        });
    }

    private function indexExists(string $table, string $indexName): bool
    {
        try {
            $driver = DB::connection()->getDriverName();

            if ($driver === 'mysql') {
                $database = DB::getDatabaseName();
                $row = DB::selectOne(
                    'SELECT COUNT(1) as c FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ?',
                    [$database, $table, $indexName]
                );

                return ((int) ($row->c ?? 0)) > 0;
            }

            if ($driver === 'sqlite') {
                $row = DB::selectOne(
                    "SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?",
                    [$indexName]
                );

                return $row !== null;
            }

            return false;
        } catch (\Throwable) {
            return false;
        }
    }
};
