<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table): void {
            $table->string('last_probe_status', 20)->nullable()->after('search_config');
            $table->string('last_probe_query', 120)->nullable()->after('last_probe_status');
            $table->unsignedSmallInteger('last_probe_count')->nullable()->after('last_probe_query');
            $table->string('last_probe_error', 255)->nullable()->after('last_probe_count');
            $table->timestamp('last_probe_at')->nullable()->after('last_probe_error');
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table): void {
            $table->dropColumn([
                'last_probe_status',
                'last_probe_query',
                'last_probe_count',
                'last_probe_error',
                'last_probe_at',
            ]);
        });
    }
};

