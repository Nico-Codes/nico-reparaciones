<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('repair_whatsapp_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('repair_id')->constrained()->cascadeOnDelete();

            // Estado que se notificó (snapshot)
            $table->string('notified_status');

            // Teléfono que se usó para WA (normalizado, con o sin 54)
            $table->string('phone', 30)->nullable();

            // Mensaje que se envió (snapshot)
            $table->text('message')->nullable();

            // Quién lo registró (admin)
            $table->foreignId('sent_by')->nullable()->constrained('users')->nullOnDelete();

            // Fecha/hora en que se registró el envío
            $table->timestamp('sent_at')->useCurrent();

            $table->timestamps();

            $table->index(['repair_id', 'sent_at']);
            $table->index(['repair_id', 'notified_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_whatsapp_logs');
    }
};
