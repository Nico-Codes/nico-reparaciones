<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('help_entries', function (Blueprint $table) {
            $table->id();
            $table->string('question', 200);
            $table->text('answer');
            $table->string('audience', 16)->default('public');
            $table->integer('sort_order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        $now = now();
        DB::table('help_entries')->insert([
            [
                'question' => 'No puedo iniciar sesion, que reviso primero?',
                'answer' => 'Verifica que el correo y la contrasena sean correctos. Si olvidaste la contrasena, usa "Olvide contrasena" en la pantalla de login para restablecerla.',
                'audience' => 'public',
                'sort_order' => 100,
                'active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'question' => 'No me llega el correo de recuperacion',
                'answer' => 'Revisa carpeta Spam o Promociones. Si no llega, espera 1-2 minutos y vuelve a intentarlo desde la opcion de recuperacion.',
                'audience' => 'public',
                'sort_order' => 90,
                'active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'question' => 'Como sigo mi pedido?',
                'answer' => 'Ingresa a "Mis pedidos" desde tu cuenta para ver estado, detalle y productos del pedido.',
                'audience' => 'public',
                'sort_order' => 80,
                'active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'question' => 'Como consulto el estado de una reparacion?',
                'answer' => 'Puedes usar la seccion "Reparacion" en el menu principal o ver "Mis reparaciones" si estas logueado.',
                'audience' => 'public',
                'sort_order' => 70,
                'active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'question' => 'El producto no permite confirmar en venta rapida',
                'answer' => 'Revisa stock disponible y margen del producto. Si el guard de margen negativo esta activo, no podra confirmarse una venta con precio menor al costo.',
                'audience' => 'admin',
                'sort_order' => 60,
                'active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'question' => 'Aparece mensaje de migraciones faltantes en admin',
                'answer' => 'Ejecuta "php artisan migrate". Luego recarga el panel para verificar que el estado de esquema vuelva a normal.',
                'audience' => 'admin',
                'sort_order' => 50,
                'active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('help_entries');
    }
};

