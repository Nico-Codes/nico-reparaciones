<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('repair_whatsapp_templates', function (Blueprint $table) {
            $table->id();

            // status = clave (received, diagnosing, ready_pickup, etc.)
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
        Schema::dropIfExists('repair_whatsapp_templates');
    }
};
