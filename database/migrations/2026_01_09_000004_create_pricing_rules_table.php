<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pricing_rules', function (Blueprint $table) {
            $table->id();

            $table->foreignId('device_type_id')->constrained('device_types')->cascadeOnDelete();
            $table->foreignId('repair_type_id')->constrained('repair_types')->cascadeOnDelete();

            $table->foreignId('device_brand_id')->nullable()->constrained('device_brands')->nullOnDelete();
            $table->foreignId('device_model_group_id')->nullable()->constrained('device_model_groups')->nullOnDelete();
            $table->foreignId('device_model_id')->nullable()->constrained('device_models')->nullOnDelete();

            // margin: total = repuesto + max(repuesto*multiplier, min_profit) + mano_obra(opc) + envio(opc)
            // fixed: total = fixed_total + envio(opc)
            $table->enum('mode', ['margin', 'fixed'])->default('margin');

            $table->decimal('multiplier', 8, 2)->nullable();   // ej 0.25 para 25%
            $table->unsignedInteger('min_profit')->nullable(); // ej 24000
            $table->unsignedInteger('fixed_total')->nullable(); // ej 45000

            $table->unsignedInteger('shipping_default')->default(0); // ej 10000

            $table->integer('priority')->default(0);
            $table->boolean('active')->default(true);

            $table->timestamps();

            $table->index(['device_type_id', 'repair_type_id', 'active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pricing_rules');
    }
};
