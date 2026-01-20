<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        $tables = [
            'device_types',
            'device_brands',
            'device_models',
            'device_issue_types',
        ];

        foreach ($tables as $table) {
            // ✅ Si la tabla todavía no existe (por orden de migrations), no hacemos nada
            if (!Schema::hasTable($table)) {
                continue;
            }

            if (!Schema::hasColumn($table, 'active')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->boolean('active')->default(true);
                });
            }
        }
    }

    public function down(): void
    {
        $tables = [
            'device_types',
            'device_brands',
            'device_models',
            'device_issue_types',
        ];

        foreach ($tables as $table) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            if (Schema::hasColumn($table, 'active')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->dropColumn('active');
                });
            }
        }
    }
};

