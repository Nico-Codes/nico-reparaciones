<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('order_whatsapp_templates', function (Blueprint $table) {
            $table->id();

            // status = clave (pendiente, confirmado, etc.)
            $table->string('status')->unique();

            // plantilla con placeholders
            $table->text('template');

            // quién la editó (admin)
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_whatsapp_templates');
    }
};
