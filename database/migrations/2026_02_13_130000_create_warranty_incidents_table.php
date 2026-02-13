<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warranty_incidents', function (Blueprint $table) {
            $table->id();
            $table->enum('source_type', ['repair', 'product']);
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->string('title', 120);
            $table->string('reason', 255)->nullable();

            $table->foreignId('repair_id')->nullable()->constrained('repairs')->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();

            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedInteger('unit_cost')->default(0);
            $table->unsignedInteger('extra_cost')->default(0);
            $table->unsignedInteger('recovered_amount')->default(0);
            $table->integer('loss_amount')->default(0);

            $table->timestamp('happened_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->text('notes')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['source_type', 'status', 'happened_at']);
            $table->index(['repair_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warranty_incidents');
    }
};

