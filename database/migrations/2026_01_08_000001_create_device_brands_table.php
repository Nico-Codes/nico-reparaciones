<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_brands', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_type_id')->constrained('device_types')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->timestamps();

            $table->unique(['device_type_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_brands');
    }
};
