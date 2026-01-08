<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('repairs', function (Blueprint $table) {
            $table->foreignId('device_type_id')->nullable()->after('customer_phone')->constrained('device_types')->nullOnDelete();
            $table->foreignId('device_brand_id')->nullable()->after('device_type_id')->constrained('device_brands')->nullOnDelete();
            $table->foreignId('device_model_id')->nullable()->after('device_brand_id')->constrained('device_models')->nullOnDelete();

            $table->index(['device_type_id', 'device_brand_id', 'device_model_id'], 'repairs_device_catalog_idx');
        });
    }

    public function down(): void
    {
        Schema::table('repairs', function (Blueprint $table) {
            $table->dropIndex('repairs_device_catalog_idx');
            $table->dropConstrainedForeignId('device_model_id');
            $table->dropConstrainedForeignId('device_brand_id');
            $table->dropConstrainedForeignId('device_type_id');
        });
    }
};
