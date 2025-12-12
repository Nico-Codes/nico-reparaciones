<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabla de usuarios de la aplicación.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            // Datos básicos
            $table->string('name');                 // Nombre
            $table->string('last_name')->nullable(); // Apellido (opcional)
            $table->string('phone')->nullable();     // Teléfono / WhatsApp (opcional)

            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();

            // Contraseña
            $table->string('password');

            // Rol: user (cliente) o admin (vos)
            $table->enum('role', ['user', 'admin'])->default('user');

            // Token "recordarme"
            $table->rememberToken();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
