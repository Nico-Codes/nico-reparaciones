<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('device_models', function (Blueprint $table) {
            $table->foreignId('device_model_group_id')
                ->nullable()
                ->after('device_brand_id')
                ->constrained('device_model_groups')
                ->nullOnDelete();

            $table->index(['device_brand_id', 'device_model_group_id']);
        });
    }

    public function down(): void
    {
        Schema::table('device_models', function (Blueprint $table) {
            $table->dropConstrainedForeignId('device_model_group_id');
        });
    }
};
