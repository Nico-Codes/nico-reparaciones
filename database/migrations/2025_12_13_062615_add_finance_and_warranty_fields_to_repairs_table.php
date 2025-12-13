<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Esta migration es "safe": solo agrega lo que falte.
        Schema::table('repairs', function (Blueprint $table) {
            if (!Schema::hasColumn('repairs', 'parts_cost')) {
                $table->decimal('parts_cost', 10, 2)->nullable();
            }
            if (!Schema::hasColumn('repairs', 'labor_cost')) {
                $table->decimal('labor_cost', 10, 2)->nullable();
            }
            if (!Schema::hasColumn('repairs', 'final_price')) {
                $table->decimal('final_price', 10, 2)->nullable();
            }
            if (!Schema::hasColumn('repairs', 'warranty_days')) {
                $table->unsignedInteger('warranty_days')->nullable();
            }
            if (!Schema::hasColumn('repairs', 'received_at')) {
                $table->dateTime('received_at')->nullable();
            }
            if (!Schema::hasColumn('repairs', 'delivered_at')) {
                $table->dateTime('delivered_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('repairs', function (Blueprint $table) {
            // Ojo: en muchos proyectos NO se usa rollback en prod.
            // Igual lo dejamos prolijo y con checks.
            $toDrop = [];
            foreach (['parts_cost', 'labor_cost', 'final_price', 'warranty_days', 'received_at', 'delivered_at'] as $col) {
                if (Schema::hasColumn('repairs', $col)) {
                    $toDrop[] = $col;
                }
            }
            if (!empty($toDrop)) {
                $table->dropColumn($toDrop);
            }
        });
    }
};
