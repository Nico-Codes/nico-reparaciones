<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('order_whatsapp_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')->constrained()->cascadeOnDelete();

            // Estado que se notificó (snapshot)
            $table->string('notified_status');

            // Teléfono que se usó para WA
            $table->string('phone', 30)->nullable();

            // Mensaje que se envió (snapshot)
            $table->text('message')->nullable();

            // Quién lo registró (admin)
            $table->foreignId('sent_by')->nullable()->constrained('users')->nullOnDelete();

            // Fecha/hora en que se registró el envío
            $table->timestamp('sent_at')->useCurrent();

            $table->timestamps();

            $table->index(['order_id', 'sent_at']);
            $table->index(['order_id', 'notified_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_whatsapp_logs');
    }
};
