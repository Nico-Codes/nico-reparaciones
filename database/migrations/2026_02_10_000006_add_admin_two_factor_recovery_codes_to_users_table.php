<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('admin_two_factor_recovery_codes')->nullable()->after('admin_two_factor_enabled_at');
            $table->timestamp('admin_two_factor_recovery_codes_generated_at')->nullable()->after('admin_two_factor_recovery_codes');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'admin_two_factor_recovery_codes',
                'admin_two_factor_recovery_codes_generated_at',
            ]);
        });
    }
};
