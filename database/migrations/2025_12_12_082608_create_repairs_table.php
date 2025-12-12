<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repairs', function (Blueprint $table) {
            $table->id();

            $table->string('code')->unique()->nullable(); // R-YYYYMMDD-00001
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            $table->string('customer_name');
            $table->string('customer_phone', 30); // guardamos normalizado (solo números)

            $table->string('device_brand')->nullable();
            $table->string('device_model')->nullable();

            $table->text('issue_reported');
            $table->text('diagnosis')->nullable();

            $table->decimal('parts_cost', 10, 2)->default(0);
            $table->decimal('labor_cost', 10, 2)->default(0);
            $table->decimal('final_price', 10, 2)->nullable();

            $table->string('status')->default('received');

            $table->unsignedInteger('warranty_days')->default(0);
            $table->timestamp('received_at')->nullable();
            $table->timestamp('delivered_at')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['status']);
            $table->index(['customer_phone']);
            $table->index(['received_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repairs');
    }
};
