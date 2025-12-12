<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabla de productos de la tienda (accesorios, cables, etc.).
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            // Relación con categoría
            $table->foreignId('category_id')
                  ->constrained('categories')
                  ->onDelete('cascade');

            $table->string('name');                       // "Funda silicona transparente"
            $table->string('slug')->unique();             // "funda-silicona-a52"
            $table->string('brand')->nullable();          // "Samsung", "Genérica", etc.

            $table->enum('quality', ['original', 'premium', 'generico'])
                  ->default('generico');

            // Precio en pesos, entero
            $table->unsignedInteger('price');

            // Stock actual
            $table->unsignedInteger('stock')->default(0);

            // Descripciones
            $table->string('short_description')->nullable();
            $table->text('description')->nullable();

            // Imagen principal (archivo o ruta relativa)
            $table->string('image')->nullable();

            // Para destacar productos en la home
            $table->boolean('featured')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
