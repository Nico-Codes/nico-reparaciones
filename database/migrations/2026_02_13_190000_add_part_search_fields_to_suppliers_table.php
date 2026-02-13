<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            if (!Schema::hasColumn('suppliers', 'search_enabled')) {
                $table->boolean('search_enabled')->default(false)->after('active');
            }
            if (!Schema::hasColumn('suppliers', 'search_mode')) {
                $table->string('search_mode', 20)->default('json')->after('search_enabled');
            }
            if (!Schema::hasColumn('suppliers', 'search_endpoint')) {
                $table->string('search_endpoint', 500)->nullable()->after('search_mode');
            }
            if (!Schema::hasColumn('suppliers', 'search_config')) {
                $table->json('search_config')->nullable()->after('search_endpoint');
            }
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            foreach (['search_config', 'search_endpoint', 'search_mode', 'search_enabled'] as $column) {
                if (Schema::hasColumn('suppliers', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

