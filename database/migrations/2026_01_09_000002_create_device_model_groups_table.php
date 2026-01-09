<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('device_model_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_brand_id')->constrained('device_brands')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['device_brand_id', 'active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_model_groups');
    }
};
