<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabla de pedidos.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            // Usuario que hizo el pedido
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            // Estado del pedido
            $table->enum('status', [
                'pendiente',       // recién hecho
                'confirmado',      // aceptado por vos
                'preparando',      // armando el pedido
                'listo_retirar',   // listo para retirar en el local
                'entregado',       // entregado al cliente
                'cancelado'        // cancelado
            ])->default('pendiente');

            // Método de pago elegido
            $table->enum('payment_method', [
                'local',
                'mercado_pago',
                'transferencia',
            ])->default('local');

            // Total del pedido (precio final en pesos)
            $table->unsignedInteger('total');

            // Datos para identificar pedido
            $table->string('pickup_name')->nullable();  // Nombre de quien retira
            $table->string('pickup_phone')->nullable(); // Teléfono de contacto

            // Notas opcionales del cliente
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
