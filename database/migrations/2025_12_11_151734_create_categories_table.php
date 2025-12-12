<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabla de categorías de productos (fundas, cables, etc.).
     */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');              // Nombre visible: "Fundas y vidrios"
            $table->string('slug')->unique();    // Para URL amigable: "fundas-vidrios"
            $table->string('description')->nullable();
            $table->string('icon')->nullable();  // Ej: emoji o nombre de icono
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
