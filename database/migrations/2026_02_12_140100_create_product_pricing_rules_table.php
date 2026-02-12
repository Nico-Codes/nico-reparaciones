<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_pricing_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->unsignedInteger('cost_min')->nullable();
            $table->unsignedInteger('cost_max')->nullable();
            $table->decimal('margin_percent', 6, 2)->default(30);
            $table->integer('priority')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['active', 'category_id', 'product_id', 'priority'], 'product_pricing_rules_active_scope_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_pricing_rules');
    }
};
